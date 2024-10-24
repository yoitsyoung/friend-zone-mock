import { toNano } from '@ton/core';
import { FriendZoneShareTest } from '../wrappers/FriendZoneShare';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const friendZoneShareTest = provider.open(await FriendZoneShareTest.fromInit());

    await friendZoneShareTest.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(friendZoneShareTest.address);

    // run methods on `friendZoneShareTest`
}
