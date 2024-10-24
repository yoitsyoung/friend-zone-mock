import { settlement } from '../scheduled-tasks/settlement';
import { prismaClient } from '../../src/db';

describe('settlement', () => {
    let userId: string;

    beforeEach(async () => {
        // Setup test data: Create a user and a few unsettled tips
        const user = await prismaClient.user.create({
            data: {
                telegramId: 'testTelegramId',
                username: 'testUser',
                dailyPersonalAllowance: 100,
                dailyTippingAllowance: 50,
                cumulativePersonalAllowance: 200,
                privateChatId: '100'
            },
        });
        userId = user.id;

        // Assume another user exists for sending tips
        const anotherUserId = await prismaClient.user.create({
            data: {
                telegramId: 'anotherTelegramId',
                username: 'anotherTestUser',
                dailyPersonalAllowance: 100,
                dailyTippingAllowance: 50,
                cumulativePersonalAllowance: 200,
                privateChatId: '101'
                // No need to set allowances for this user as it only sends tips
            },
        }).then(u => u.id);

        // Create unsettled tips received by the first user
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

    it('correctly settles all tips and updates user balances', async () => {
        await settlement();

        // Verify that the user's cumulativePersonalAllowance is updated
        const updatedUser = await prismaClient.user.findUnique({
            where: { id: userId },
            select: {
                cumulativePersonalAllowance: true,
                dailyPersonalAllowance: true,
                dailyTippingAllowance: true,
                tipsReceived: {
                    where: { settled: true },
                    select: { amount: true },
                },
            },
        });
        // Ensure that the updatedUser is not null before proceeding
        expect(updatedUser).not.toBeNull();

        if(updatedUser) {
            expect(updatedUser.cumulativePersonalAllowance).toEqual(350); // Original 200 + 100 daily + 50 (20+30) from tips
            expect(updatedUser.dailyPersonalAllowance).toEqual(0); // Assuming calculateDailyPersonalAllowance resets this to 0
            expect(updatedUser.dailyTippingAllowance).toEqual(0); // Assuming calculateDailyTippingAllowance resets this to 0
            expect(updatedUser.tipsReceived.length).toEqual(2); // Ensure all tips are now marked as settled
            updatedUser.tipsReceived.forEach(tip => {
                expect(tip.amount).toBeGreaterThanOrEqual(20); // Checks if the tips are the ones we created
            });
        }
    });
});
