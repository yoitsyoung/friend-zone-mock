import { prismaClient } from "../../src/db";

async function createTip(fromUserId: string, toUserId: string, tipAmount: number) {
    const fromUser = await prismaClient.user.findUnique({
        where: { id: fromUserId },
        select: {
            dailyTippingAllowance: true,
        }
    });

    if (!fromUser) {
        throw new Error('Sender not found');
    }
    //Check if fromUser and toUser are the same
    if (fromUserId == toUserId) {
        throw new Error('FromUserId and ToUserId must be different')
    }

    // Check if the tip exceeds the user's daily tipping allowance
    if (tipAmount > fromUser.dailyTippingAllowance) {
        throw new Error('Tip exceeds daily tipping allowance');
    }

    // Begin a transaction to ensure data integrity
    const result = await prismaClient.$transaction(async (prismaClient) => {
        // Create the tip
        const tip = await prismaClient.tip.create({
            data: {
            amount: tipAmount,
            fromUserId,
            toUserId,
            settled: false, // Assuming tips are initially unsettled
            },
        });

        // Deduct the tip amount from the sender's daily tipping allowance
        await prismaClient.user.update({
            where: { id: fromUserId },
            data: {
                dailyTippingAllowance: {
                    decrement: tipAmount
                }
            },
        });

        return tip;
    });
    return result;
}

export { createTip };
