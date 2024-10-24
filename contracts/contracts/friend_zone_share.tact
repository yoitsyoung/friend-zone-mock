import "./jetton.tact";
import "./messages.tact";

struct ShareMetadata {
    totalSupply: Int as coins;
    owner: Address;
    content: Cell;
    mintable: Bool;

    enabled: Bool;
    parent: Address;
    chatId: Int as int64;
    shareFeePercent: Int as uint256;
    protocolFeePercent: Int as uint256;
    balance: Int as coins;
}

contract FriendZoneShare with Jetton {
    totalSupply: Int as coins; // required by Jetton
    owner: Address;            // required by Jetton
    content: Cell;             // required by Jetton
    mintable: Bool;            // required by Jetton

    enabled: Bool;                      // indicates whether share is created
    parent: Address;                    // parent FriendZone address
    chatId: Int as int64;               // telegram chat id
    shareFeePercent: Int as uint256;    // share fee percentage, sent to owner
    protocolFeePercent: Int as uint256; // protocol fee percentage, sent to parent

    // each share should be unique based on (parent, owner, chatId)
    init(parent: Address, owner: Address, chatId: Int) {
        self.totalSupply = 0;
        self.owner = owner;
        self.mintable = true;
        self.content = emptyCell();

        self.parent = parent;
        self.chatId = chatId;
        self.shareFeePercent = 0;
        self.protocolFeePercent = 0;
        self.enabled = false;
    }

    receive(msg: InternalCreateShare) {
        require(sender() == self.parent, "Must be called from FriendZone");
        require(self.totalSupply == 0, "Share already created");

        self.shareFeePercent = msg.shareFeePercent;
        self.content = msg.content;
        self.protocolFeePercent = msg.protocolFeePercent;
        self.enabled = true;

        // send extra value back to sender
        send(SendParameters{
            to: msg.originalSender,
            value: 0,
            bounce: false,
            mode: SendIgnoreErrors + SendRemainingValue
        });
    }

    receive(msg: BuyShare) {
        require(self.enabled && self.mintable, "Minting is disabled");
        if (self.totalSupply == 0) {
            require(sender() == self.owner, "Only owner can buy the first share");
        }
        let context: Context = context();
        let price: Int = self.calculatePrice(self.totalSupply, msg.amount);
        let shareFee: Int = price * self.shareFeePercent / 100;
        let protocolFee: Int = price * self.protocolFeePercent / 100;
        let forwardFee: Int = context.readForwardFee();
        require(context.value >= price + shareFee + protocolFee + forwardFee * 2, "Not enough value");

        // FIXME: for some reason, adding SendPayGasSeparately to the mode causes an error
        // transfer share fee to owner
        send(SendParameters{
            to: self.owner,
            value: shareFee + forwardFee,
            bounce: false,
            body: SendShareFeeSuccess{ amount: shareFee }.toCell(),
            mode: SendIgnoreErrors
        });
        // FIXME: for some reason, adding SendPayGasSeparately to the mode causes an error
        // transfer protocol fee to parent
        send(SendParameters{
            to: self.parent,
            value: protocolFee + forwardFee,
            bounce: false,
            body: SendProtocolFeeSuccess{ amount: protocolFee }.toCell(),
            mode: SendIgnoreErrors
        });

        self.mint(msg.receiver, msg.amount, myAddress()); // (to, amount, response_destination)

        // cashback to sender
        let remainingValue: Int = context.value - price - shareFee - protocolFee - forwardFee * 2;
        if (remainingValue > 0) {
            // send extra value back to sender
            send(SendParameters{
                to: sender(),
                value: remainingValue,
                bounce: false,
                mode: SendIgnoreErrors
            });
        }
    }

    // TODO: fees apply on sell?
    receive(msg: SellShare) {
        require(self.totalSupply > 0, "No share to sell");
        require(msg.amount <= self.totalSupply, "Not enough shares to sell");

        let price: Int = self.calculatePrice(self.totalSupply - msg.amount, msg.amount);

        self.burn(msg.seller, msg.amount, myAddress()); // (target, amount, response_destination)

        // transfer price back to seller
        send(SendParameters{
            to: msg.seller,
            value: price - context().value,
            bounce: false,
            mode: SendIgnoreErrors + SendRemainingValue
        });
    }

    receive(msg: MintStatus) {
        self.requireOwner();
        self.mintable = msg.mintable;
    }

    // getters
    get fun calculatePrice(supply: Int, amount: Int): Int {
        if (supply == 0) {
            if (amount == 1) {
                return 0;
            }
            return (amount - 1) * amount * (2 * (amount - 1) + 1) / 6 * ton("1") / 16000;
        }
        let sum1: Int = (supply - 1) * (supply) * (2 * (supply - 1) + 1) / 6;
        let sum2: Int = (supply - 1 + amount) * (supply + amount) * (2 * (supply - 1 + amount) + 1) / 6;
        let summation: Int = sum2 - sum1;
        return summation * ton("1") / 16000;
    }

    get fun metadata(): ShareMetadata {
        return ShareMetadata{
            totalSupply: self.totalSupply,
            owner: self.owner,
            content: self.content,
            mintable: self.mintable,
            enabled: self.enabled,
            parent: self.parent,
            chatId: self.chatId,
            shareFeePercent: self.shareFeePercent,
            protocolFeePercent: self.protocolFeePercent,
            balance: myBalance()
        };
    }
}
