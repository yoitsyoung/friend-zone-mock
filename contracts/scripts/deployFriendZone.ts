import { Address, toNano } from '@ton/core';
import { FriendZone } from '../wrappers/FriendZone';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const sender = provider.sender();
    const address = sender.address;
    if (!address) {
        throw new Error('No address');
    }
    const friendZone = provider.open(await FriendZone.fromInit(sender.address, 5n));

    await friendZone.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        },
    );

    await provider.waitForDeploy(friendZone.address);

    console.log('Owner', await friendZone.getOwner());
}
