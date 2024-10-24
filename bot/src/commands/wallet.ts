import { CHAIN, toUserFriendlyAddress } from "@tonconnect/sdk";
import TelegramBot from "node-telegram-bot-api";
import { bot } from "../bot";
import { getConnector } from "../ton-connect/connector";
import { redisClient } from "../ton-connect/storage";
import { getWalletInfo } from "../ton-connect/wallets";
import { prismaClient } from "../db";

export async function handleShowMyWalletCommand(
  msg: TelegramBot.Message
): Promise<void> {
  const chatId = msg.chat.id;
  if (msg.chat.type !== "private") {
    await bot.sendMessage(
      chatId,
      "This command is only available in private chat"
    );
    return;
  }

  const connector = getConnector(chatId);

  await connector.restoreConnection();
  if (!connector.connected) {
    await bot.sendMessage(chatId, "You didn't connect a wallet");
    return;
  }

  // associate private chat id with user
  const user = await prismaClient.user.findFirst({
    where: {
      telegramId: String(msg.from?.id),
    },
  });
  if (user === null) {
    await prismaClient.user.create({
      data: {
        telegramId: String(msg.from?.id),
        privateChatId: msg.chat.id.toString(),
        username: String(msg.from?.username),
        walletAddress: connector.wallet!.account.address,
      },
    });
  } else {
    await prismaClient.user.update({
      where: {
        telegramId: String(msg.from?.id),
      },
      data: {
        privateChatId: msg.chat.id.toString(),
        walletAddress: connector.wallet!.account.address,
      },
    });
  }
  const walletName =
    (await getWalletInfo(connector.wallet!.device.appName))?.name ||
    connector.wallet!.device.appName;

  await bot.sendMessage(
    chatId,
    `Connected wallet: ${walletName}\nYour address: \`${toUserFriendlyAddress(
      connector.wallet!.account.address,
      connector.wallet!.account.chain === CHAIN.TESTNET
    )}\``,
    {
      parse_mode: "MarkdownV2",
    }
  );
}
