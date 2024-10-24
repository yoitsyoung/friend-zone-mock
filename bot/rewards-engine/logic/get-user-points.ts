import { prismaClient } from "../../src/db";


async function getUserPoints (
    userId: string
) {
    const user = await prismaClient.user.findUnique({
        where: { id: userId },
        select: {
            cumulativePersonalAllowance: true,
            tipsReceived: {
                where: { settled: false },
                select: { amount: true },
            }
        }
    })

    if (!user) {
    throw new Error('User not found');
    }

    const unsettledTipsTotal = user.tipsReceived.reduce((sum: any, currentTip: { amount: any; }) => sum + currentTip.amount, 0);
    const totalBalance = user.cumulativePersonalAllowance + unsettledTipsTotal;
    return totalBalance;

}

export { getUserPoints };
