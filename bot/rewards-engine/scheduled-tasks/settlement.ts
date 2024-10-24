import { prismaClient } from "../../src/db";
import { User } from '@prisma/client';

async function settlement() {
  // Get all users
    const users = await prismaClient.user.findMany({
    include: {
        tipsReceived: {
        where: { settled: false },
        select: { amount: true },
        },
    },
    });

    for (const user of users) {
        // Calculate total of unsettled received tips
        const totalUnsettledTips = user.tipsReceived.reduce((sum: any, tip: { amount: any; }) => sum + tip.amount, 0);

          // Dynamically calculate allowances based on user activities or attributes
    const newPersonalAllowance = await calculateDailyPersonalAllowance(user);
    const newTippingAllowance = await calculateDailyTippingAllowance(user);
        // Update user's cumulativePersonalAllowance and reset daily allowances
    await prismaClient.user.update({
        where: { id: user.id },
        data: {
        cumulativePersonalAllowance: {
            increment: totalUnsettledTips + user.dailyPersonalAllowance,
        },
        dailyPersonalAllowance: { set: newPersonalAllowance },
        dailyTippingAllowance: { set: newTippingAllowance },
        },
    });

    //reset settled tips
    await prismaClient.tip.updateMany({
        where: {
            toUserId: user.id,
            settled: false,
        },
        data: {
            settled: true,
        },
    });
}
}

async function calculateDailyPersonalAllowance(_user: User) {
  // Calculate Personal Allowance
  // For efficiency, use pre-calculated metrics or minimal queries
  return 0; // Example static value, replace with actual logic
}

async function calculateDailyTippingAllowance(_user: User) {
  // Calculate Tipping Allowance
  return 0; // Example static value, replace with actual logic
}

export { settlement };

