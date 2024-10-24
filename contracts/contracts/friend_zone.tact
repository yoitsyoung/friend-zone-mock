import "@stdlib/deploy";
import "@stdlib/ownable";
import "./messages.tact";
import "./friend_zone_share.tact";

struct Metadata {
    protocolFeeDestination: Address;
    protocolFeePercent: Int;
    balance: Int as coins;
}

contract FriendZone with Deployable, OwnableTransferable {
    owner: Address; // required by OwnableTransferable trait

    protocolFeeDestination: Address;
    protocolFeePercent: Int as uint256;

    init(protocolFeeDestination: Address, protocolFeePercent: Int) {
        self.owner = sender();
        self.protocolFeeDestination = protocolFeeDestination;
        self.protocolFeePercent = protocolFeePercent;
    }

    // owner only functions
    receive(msg: SetProtocolFeeDestination) {
        self.requireOwner();
        self.protocolFeeDestination = msg.protocolFeeDestination;
    }

    receive(msg: SetProtocolFeePercent) {
        self.requireOwner();
        self.protocolFeePercent = msg.protocolFeePercent;
    }

    receive(msg: Withdraw) {
        self.requireOwner();
        self.sendProtocolFeeToDestination(msg.value);

        self.reply(WithdrawSuccess{amount: msg.value}.toCell());
    }

    // public functions
    receive(msg: CreateShare) {
        self.createShare(msg.owner, msg.content, msg.chatId, msg.shareFeePercent);

        self.reply(CreateShareSuccess{chatId: msg.chatId}.toCell());
    }

    receive() {}

    // internal functions
    fun sendProtocolFeeToDestination(value: Int) {
        send(SendParameters{
            to: self.protocolFeeDestination,
            value: value,
            mode: SendIgnoreErrors + SendRemainingValue
        });
    }

    fun createShare(owner: Address, content: Cell, chatId: Int, shareFeePercent: Int) {
        let shareInit: StateInit = initOf FriendZoneShare(myAddress(), owner, chatId);
        send(SendParameters{
            to: contractAddress(shareInit),
            body: InternalCreateShare{
                protocolFeePercent: self.protocolFeePercent,
                shareFeePercent: shareFeePercent,
                content: content,
                originalSender: sender()
            }.toCell(),
            value: 0,
            mode: SendIgnoreErrors + SendRemainingValue,
            code: shareInit.code,
            data: shareInit.data
        });
    }


    // getters
    get fun metadata(): Metadata {
        return Metadata{
            protocolFeeDestination: self.protocolFeeDestination,
            protocolFeePercent: self.protocolFeePercent,
            balance: myBalance()
        };
    }

    // From telegram docs, chat id has at most 52 significant bits, so a signed 64-bit integer or double-precision float type is safe for storing this identifier
    get fun shareAddress(owner: Address, chatId: Int, shareFee: Int): Address {
        return contractAddress(initOf FriendZoneShare(myAddress(), owner, chatId));
    }

    // receive(msg: ChangeOwner) is added automatically to transfer ownership
    // get fun owner(): Address is added automatically to query who the owner is
}
