import { isTelegramUrl } from "@tonconnect/sdk";
import * as fs from "fs";
import TelegramBot, { CallbackQuery } from "node-telegram-bot-api";
import QRCode from "qrcode";
import { bot } from "./bot";
import { getConnector } from "./ton-connect/connector";
import { getWalletInfo, getWallets } from "./ton-connect/wallets";
import { addTGReturnStrategy, buildUniversalKeyboard } from "./utils";

export const walletMenuCallbacks = {
  chose_wallet: onChooseWalletClick,
  select_wallet: onWalletClick,
  universal_qr: onOpenUniversalQRClick,
};

async function onChooseWalletClick(
  query: CallbackQuery,
  _: string
): Promise<void> {
  const wallets = await getWallets();

  try {
    await bot.editMessageReplyMarkup(
      {
        inline_keyboard: [
          wallets.map((wallet) => ({
            text: wallet.name,
            callback_data: JSON.stringify({
              method: "select_wallet",
              data: wallet.appName,
            }),
          })),
          [
            {
              text: "« Back",
              callback_data: JSON.stringify({
                method: "universal_qr",
              }),
            },
          ],
        ],
      },
      {
        message_id: query.message!.message_id,
        chat_id: query.message!.chat.id,
      }
    );
  } catch (error) {
    console.log("Editing message in onChooseWalletClick", error);
  }
}
async function onOpenUniversalQRClick(
  query: CallbackQuery,
  _: string
): Promise<void> {
  const chatId = query.message!.chat.id;
  const wallets = await getWallets();

  const connector = getConnector(chatId);

  const link = connector.connect(wallets);

  await editQR(query.message!, link);

  const keyboard = await buildUniversalKeyboard(link, wallets);

  try {
    await bot.editMessageReplyMarkup(
      {
        inline_keyboard: [keyboard],
      },
      {
        message_id: query.message?.message_id,
        chat_id: query.message?.chat.id,
      }
    );
  } catch (error) {
    console.log(error);
  }
}

async function onWalletClick(
  query: CallbackQuery,
  data: string
): Promise<void> {
  const chatId = query.message!.chat.id;
  const connector = getConnector(chatId);

  const selectedWallet = await getWalletInfo(data);
  if (!selectedWallet) {
    return;
  }

  if (
    !("bridgeUrl" in selectedWallet) ||
    !("universalLink" in selectedWallet)
  ) {
    console.error(
      "Invalid wallet info, missing bridgeUrl or universalLink",
      selectedWallet
    );
    return;
  }

  let buttonLink = connector.connect({
    bridgeUrl: selectedWallet.bridgeUrl,
    universalLink: selectedWallet.universalLink,
  });

  let qrLink = buttonLink;

  if (isTelegramUrl(selectedWallet.universalLink)) {
    buttonLink = addTGReturnStrategy(
      buttonLink,
      process.env.TELEGRAM_BOT_LINK!
    );
    qrLink = addTGReturnStrategy(qrLink, "none");
  }

  await editQR(query.message!, qrLink);

  try {
    await bot.editMessageReplyMarkup(
      {
        inline_keyboard: [
          [
            {
              text: "« Back",
              callback_data: JSON.stringify({ method: "chose_wallet" }),
            },
            {
              text: `Open ${selectedWallet.name}`,
              url: buttonLink,
            },
          ],
        ],
      },
      {
        message_id: query.message?.message_id,
        chat_id: chatId,
      }
    );
  } catch (error) {
    console.log("Editing message in onWalletClick", error);
  }
}

async function editQR(
  message: TelegramBot.Message,
  link: string
): Promise<void> {
  const fileName = "QR-code-" + Math.round(Math.random() * 10000000000);

  await QRCode.toFile(`./${fileName}`, link);

  try {
    await bot.editMessageMedia(
      {
        type: "photo",
        media: `attach://${fileName}`,
      },
      {
        message_id: message?.message_id,
        chat_id: message?.chat.id,
      }
    );

    await new Promise((r) => fs.rm(`./${fileName}`, r));
  } catch (error) {
    console.log("Editing QR", error);
  }
}
