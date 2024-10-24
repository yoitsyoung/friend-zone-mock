import { CHAIN, toUserFriendlyAddress } from "@tonconnect/sdk";
import TelegramBot from "node-telegram-bot-api";
import QRCode from "qrcode";
import { bot } from "../bot";
import { prismaClient } from "../db";
import { getConnector } from "../ton-connect/connector";
import { getWalletInfo, getWallets } from "../ton-connect/wallets";
import { buildUniversalKeyboard } from "../utils";

const newConnectRequestListenersMap = new Map<number, () => void>();

export async function handleConnectCommand(
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
  if (!msg.from || !msg.from.username) {
    return;
  }

  // associate private chat id with user
  await prismaClient.user.upsert({
    where: {
      telegramId: String(msg.from?.id),
    },
    update: {
      privateChatId: msg.chat.id.toString(),
    },
    create: {
      telegramId: msg.from.id?.toString(),
      privateChatId: msg.chat.id.toString(),
      username: msg.from.username?.toString(),
    },
  });

  let messageWasDeleted = false;

  newConnectRequestListenersMap.get(chatId)?.();

  const connector = getConnector(chatId);
  await connector.restoreConnection();

  if (connector.connected) {
    // associate user with wallet address
    await prismaClient.user.update({
      where: {
        telegramId: String(msg.from?.id),
      },
      data: {
        walletAddress: connector.wallet!.account.address,
      },
    });
    const connectedName =
      (await getWalletInfo(connector.wallet!.device.appName))?.name ||
      connector.wallet!.device.appName;
    await bot.sendMessage(
      chatId,
      `You have already connected with wallet: ${connectedName}\nYour address: \`${toUserFriendlyAddress(
        connector.wallet!.account.address,
        connector.wallet!.account.chain === CHAIN.TESTNET
      )}\`\n\nDisconnect your wallet first with /disconnect`,
      { parse_mode: "MarkdownV2" }
    );
    return;
  }

  const unsubscribe = connector.onStatusChange(async (wallet) => {
    if (wallet) {
      await deleteMessage();

      const walletName =
        (await getWalletInfo(wallet.device.appName))?.name ||
        wallet.device.appName;
      await bot.sendMessage(
        chatId,
        `${walletName} wallet connected successfully`
      );
      unsubscribe();
      newConnectRequestListenersMap.delete(chatId);
    }
  });

  const wallets = await getWallets();

  const link = connector.connect(wallets);
  const image = await QRCode.toBuffer(link);

  const keyboard = await buildUniversalKeyboard(link, wallets);

  const botMessage = await bot.sendPhoto(chatId, image, {
    reply_markup: {
      inline_keyboard: [keyboard],
    },
  });

  const deleteMessage = async (): Promise<void> => {
    if (!messageWasDeleted) {
      messageWasDeleted = true;
      await bot.deleteMessage(chatId, botMessage.message_id);
    }
  };

  newConnectRequestListenersMap.set(chatId, async () => {
    unsubscribe();

    await deleteMessage();

    newConnectRequestListenersMap.delete(chatId);
  });
}
