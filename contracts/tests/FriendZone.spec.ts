import { Address, Cell, beginCell, toNano } from '@ton/core';
import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import '@ton/test-utils';
import { FriendZone, storeCreateShare, type CreateShare } from '../wrappers/FriendZone';
import { FriendZoneShare } from '../wrappers/FriendZoneShare';

describe('FriendZone', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let friendZone: SandboxContract<FriendZone>;

    let protocolFeeDestination: Address;
    const protocolFeePercent = 5n;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
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
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and friendZoneShareTest are ready to use
    });

    it('should have correct init fields', async () => {
        const owner = await friendZone.getOwner();
        const { protocolFeeDestination, protocolFeePercent } = await friendZone.getMetadata();

        expect(owner.equals(deployer.address)).toBe(true);
        expect(protocolFeeDestination.equals(deployer.address)).toBe(true);
        expect(protocolFeePercent).toBe(5n);
    });

    it('should be able to call setters', async () => {
        const newOwner = await blockchain.treasury('newowner');
        const newProtocolFeeDestination = await blockchain.treasury('newprotocolfeedestination');
        const newProtocolFeePercent = 10n;

        await friendZone.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'ChangeOwner',
                queryId: 0n,
                newOwner: newOwner.address,
            },
        );
        await friendZone.send(
            newOwner.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'SetProtocolFeeDestination',
                protocolFeeDestination: newProtocolFeeDestination.address,
            },
        );
        await friendZone.send(
            newOwner.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'SetProtocolFeePercent',
                protocolFeePercent: newProtocolFeePercent,
            },
        );

        expect((await friendZone.getOwner()).equals(newOwner.address)).toBe(true);
        const { protocolFeeDestination, protocolFeePercent } = await friendZone.getMetadata();
        expect(protocolFeeDestination.equals(newProtocolFeeDestination.address)).toBe(true);
        expect(protocolFeePercent).toBe(newProtocolFeePercent);
    });

    it('should be able to create shares', async () => {
        const chatId = 100n;
        const shareFeePercent = 1n;
        const content = Cell.EMPTY;
        const owner = await blockchain.treasury('owner');

        const message: CreateShare = {
            $$type: 'CreateShare',
            chatId,
            owner: owner.address,
            content,
            shareFeePercent: shareFeePercent,
        };
        const result = await friendZone.send(
            owner.getSender(),
            {
                value: toNano('1'),
            },
            message,
        );
        const createShareBody = beginCell().store(storeCreateShare(message)).endCell();
        expect(result.transactions).toHaveTransaction({
            from: owner.address,
            to: friendZone.address,
            success: true,
            body: createShareBody,
        });

        const friendZoneShareAddress = await friendZone.getShareAddress(owner.address, chatId, shareFeePercent);
        const friendZoneShare = blockchain.openContract(FriendZoneShare.fromAddress(friendZoneShareAddress));

        const {
            chatId: currentChatId,
            enabled,
            protocolFeePercent: currentProtocolFeePercent,
            shareFeePercent: currentShareFeePercent,
            parent,
        } = await friendZoneShare.getMetadata();
        expect(currentChatId).toBe(chatId);
        expect(enabled).toBe(true);
        expect(currentProtocolFeePercent).toBe(protocolFeePercent);
        expect(currentShareFeePercent).toBe(shareFeePercent);
        expect(parent.equals(friendZone.address)).toBe(true);
        expect((await friendZoneShare.getOwner()).equals(owner.address)).toBe(true);
    });
});
