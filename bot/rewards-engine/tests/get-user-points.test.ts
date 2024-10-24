import { getUserPoints } from '../logic/get-user-points';
import { prismaClient } from '../../src/db';

describe('getUserPoints', () => {
    let userId: string;
    let anotherUserId: string; // ID for another user who will send tips

    beforeEach(async () => {
        // Setup test data: Create two users
        const user = await prismaClient.user.create({
            data: {
                telegramId: '123456', // Ensure unique constraints are met
                username: 'testUser',
                cumulativePersonalAllowance: 100,
                dailyTippingAllowance: 50,
                privateChatId: "100"
            },
        });
        userId = user.id;

        // Create another user who will send the tips
        const anotherUser = await prismaClient.user.create({
            data: {
                telegramId: '654321', // Ensure unique constraints are met
                username: 'anotherTestUser',
                cumulativePersonalAllowance: 100,
                dailyTippingAllowance: 50,
                privateChatId: "101"
            },
        });
        anotherUserId = anotherUser.id;

        // Create a few unsettled tips received by the first user from the second user
        await prismaClient.tip.createMany({
            data: [
                { fromUserId: anotherUserId, toUserId: userId, amount: 20, settled: false },
                { fromUserId: anotherUserId, toUserId: userId, amount: 30, settled: false },
            ],
        });
    });

    afterEach(async () => {
        // Cleanup test data
        await prismaClient.tip.deleteMany({});
        await prismaClient.user.deleteMany({});
    });

    it('calculates the correct total balance including unsettled tips', async () => {
        // Act: Retrieve the total balance for the test user
        const totalBalance = await getUserPoints(userId);

        // Assert: The total balance should be the sum of cumulativePersonalAllowance and unsettled tips
        expect(totalBalance).toEqual(100 + 20 + 30); // 150, assuming cumulativePersonalAllowance of 100 and tips of 20 and 30
    });

    it('throws an error for non-existing user', async () => {
        // Act & Assert: Expect getUserPoints to throw for a non-existing user ID
        await expect(getUserPoints('nonExistingUserId')).rejects.toThrow('User not found');
    });
})
