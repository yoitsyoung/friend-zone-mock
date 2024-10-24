import { Address, Cell, beginCell, toNano } from '@ton/core';
import { Blockchain, SandboxContract, TreasuryContract, prettyLogTransactions } from '@ton/sandbox';
import '@ton/test-utils';
import { FriendZone } from '../wrappers/FriendZone';
import { FriendZoneShare, storeBuyShare, type BuyShare } from '../wrappers/FriendZoneShare';

describe('FriendZoneShare', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    /** NOTE: owner only has 1 TON */
    let owner: SandboxContract<TreasuryContract>;
    let friendZone: SandboxContract<FriendZone>;
    let friendZoneShare: SandboxContract<FriendZoneShare>;

    let protocolFeeDestination: Address;
    const protocolFeePercent = 5n;
    const chatId = 100n;
    const shareFeePercent = 1n;
    const content = Cell.EMPTY;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        owner = await blockchain.treasury('owner', {
            balance: toNano('1'),
        });
        protocolFeeDestination = deployer.address;

        friendZone = blockchain.openContract(await FriendZone.fromInit(protocolFeeDestination, protocolFeePercent));

        const deployResult = await friendZone.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: friendZone.address,
            deploy: true,
            success: true,
        });

        const createShareResult = await friendZone.send(
            deployer.getSender(),
            {
                value: toNano('1'),
            },
            {
                $$type: 'CreateShare',
                chatId,
                owner: owner.address,
                content,
                shareFeePercent,
            },
        );
        expect(createShareResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: friendZone.address,
            success: true,
        });

        friendZoneShare = blockchain.openContract(
            FriendZoneShare.fromAddress(await friendZone.getShareAddress(owner.address, chatId, shareFeePercent)),
        );
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and friendZoneShareTest are ready to use
    });

    it('should be able to call setters', async () => {
        await friendZoneShare.send(
            owner.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'MintStatus',
                mintable: false,
            },
        );

        const { mintable } = await friendZoneShare.getMetadata();
        expect(mintable).toBe(false);
    });

    describe('should be able to buy shares', () => {
        it('non-owners cannot buy first share', async () => {
            const buyer = await blockchain.treasury('buyer');
            const amount = 1n;

            const message: BuyShare = {
                $$type: 'BuyShare',
                amount,
                receiver: buyer.address,
            };
            const res = await friendZoneShare.send(
                buyer.getSender(),
                {
                    value: toNano('1'),
                },
                message,
            );
            expect(res.transactions).toHaveTransaction({
                from: buyer.address,
                to: friendZoneShare.address,
                body: beginCell().store(storeBuyShare(message)).endCell(),
                success: false,
            });

            const { totalSupply } = await friendZoneShare.getMetadata();
            expect(totalSupply).toBe(0n);
        });

        it('non-owners can buy subsequent shares', async () => {
            await friendZoneShare.send(
                owner.getSender(),
                {
                    value: toNano('0.5'),
                },
                {
                    $$type: 'BuyShare',
                    amount: 1n,
                    receiver: owner.address,
                },
            );

            const buyer = await blockchain.treasury('buyer');
            const message: BuyShare = {
                $$type: 'BuyShare',
                amount: 1n,
                receiver: buyer.address,
            };
            const res = await friendZoneShare.send(
                buyer.getSender(),
                {
                    value: toNano('1'),
                },
                message,
            );

            expect(res.transactions).toHaveTransaction({
                from: buyer.address,
                to: friendZoneShare.address,
                body: beginCell().store(storeBuyShare(message)).endCell(),
                success: true,
            });

            const { totalSupply } = await friendZoneShare.getMetadata();
            expect(totalSupply).toBe(2n);
        });

        it('owner can buy first share', async () => {
            const receiver = await blockchain.treasury('buyer');

            const message: BuyShare = {
                $$type: 'BuyShare',
                amount: 1n,
                receiver: receiver.address,
            };
            const res = await friendZoneShare.send(
                owner.getSender(),
                {
                    value: toNano('0.9'),
                },
                message,
            );
            expect(res.transactions).toHaveTransaction({
                from: owner.address,
                to: friendZoneShare.address,
                body: beginCell().store(storeBuyShare(message)).endCell(),
                success: true,
            });

            const { totalSupply } = await friendZoneShare.getMetadata();
            expect(totalSupply).toBe(1n);
        });

        // TODO: fix
        it.skip('fees should be sent correctly', async () => {
            const amount = 2n;
            const message: BuyShare = {
                $$type: 'BuyShare',
                amount,
                receiver: deployer.address,
            };
            const price = await friendZoneShare.getCalculatePrice(0n, amount);
            const protocolFee = (price * protocolFeePercent) / 100n;
            const shareFee = (price * shareFeePercent) / 100n;

            const res = await friendZoneShare.send(
                owner.getSender(),
                {
                    value: price + protocolFee + shareFee + toNano('0.1'),
                },
                message,
            );

            console.log({
                friendZone: friendZone.address,
                friendZoneShare: friendZoneShare.address,
                deployer: deployer.address,
                owner: owner.address,
            });
            prettyLogTransactions(res.transactions);

            // share fee
            expect(res.transactions).toHaveTransaction({
                from: friendZoneShare.address,
                to: deployer.address,
                success: true,
                // value: shareFee,
            });
            // protocol fee
            expect(res.transactions).toHaveTransaction({
                from: friendZoneShare.address,
                to: friendZone.address,
                success: true,
                // value: protocolFee,
            });
        });
    });

    describe.skip('should be able to sell shares', () => {
        it('should be able to sell shares', async () => {
            const buyAmount = 2n;
            const sellAmount = 1n;

            await friendZoneShare.send(
                owner.getSender(),
                {
                    value: toNano('0.5'),
                },
                {
                    $$type: 'BuyShare',
                    amount: buyAmount,
                    receiver: owner.address,
                },
            );

            const { totalSupply } = await friendZoneShare.getMetadata();
            expect(totalSupply).toBe(buyAmount);

            const res = await friendZoneShare.send(
                owner.getSender(),
                {
                    value: toNano('0.5'),
                },
                {
                    $$type: 'SellShare',
                    amount: sellAmount,
                    seller: owner.address,
                },
            );
            // expect(res.transactions).toHaveTransaction({
            //     from: owner.address,
            //     to: friendZoneShare.address,
            //     success: true,
            // });

            const { totalSupply: newTotalSupply } = await friendZoneShare.getMetadata();
            expect(newTotalSupply).toBe(buyAmount - sellAmount);
        });
    });
});
