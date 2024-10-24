import TelegramBot from "node-telegram-bot-api";
import { bot } from "../bot";
import { getConnector } from "../ton-connect/connector";
import { redisClient } from "../ton-connect/storage";

export async function handleDisconnectCommand(
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
    await bot.sendMessage(chatId, "No wallet connected, run /connect first.");
    return;
  }

  await connector.disconnect();
  // remove user association with wallet address
  if (msg.from) {
    redisClient.del(`user:${msg.from.id}`);
  }

  await bot.sendMessage(chatId, "Wallet has been disconnected!");
}
