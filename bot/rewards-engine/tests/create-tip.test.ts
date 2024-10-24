// tests/logic/create-tip.test.ts
import { createTip } from '../logic/create-tip';
import { prismaClient } from '../../src/db';


describe('createTip', () => {
    let fromUserId: string;
    let toUserId: string;

    beforeEach(async () => {
    const fromUser = await prismaClient.user.create({
        data: { telegramId: 'fromUser', username: 'fromUser', dailyTippingAllowance: 100 , privateChatId: '100'},
    });
    fromUserId = fromUser.id;

    const toUser = await prismaClient.user.create({
        data: { telegramId: 'toUser', username: 'toUser', dailyTippingAllowance: 20,  privateChatId: '101'},
    });
    toUserId = toUser.id;
    });

    afterEach(async () => {
        // Cleanup test data
        await prismaClient.tip.deleteMany({});
        await prismaClient.user.deleteMany({});
    });

    it('successfully creates a tip', async () => {
    await createTip(fromUserId, toUserId, 50);
    const tips = await prismaClient.tip.findMany({
        where: {fromUserId: fromUserId, toUserId: toUserId },
    });
    expect(tips.length).toBe(1);
    expect(tips[0]?.amount).toBe(50);

    // Check if the daily tipping allowance was deducted
    const fromUserAfter = await prismaClient.user.findUnique({
        where: { id: fromUserId },
    });
    expect(fromUserAfter?.dailyTippingAllowance).toBe(50);
    });

    it('does not allow users to send tips to themselves', async () => {
        await expect(createTip(fromUserId, fromUserId, 50)).rejects.toThrow('FromUserId and ToUserId must be different');
    });

    it('does not allow users to send more tips than their allowance', async () => {
        await expect(createTip(toUserId, fromUserId, 30)).rejects.toThrow('Tip exceeds daily tipping allowance')
    })

    // Additional tests like exceeding allowance, invalid users, etc.
});
