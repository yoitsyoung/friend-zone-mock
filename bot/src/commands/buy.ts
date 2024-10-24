import { address, beginCell, Cell, toNano } from "@ton/core";
import { CHAIN, isTelegramUrl, UserRejectsError } from "@tonconnect/sdk";
import TelegramBot from "node-telegram-bot-api";
import { bot } from "../bot";
import { FRIENDZONE_CONTRACT_ADDRESS } from "../constants";
import { getConnector } from "../ton-connect/connector";
import { redisClient } from "../ton-connect/storage";
import { getWalletInfo } from "../ton-connect/wallets";
import { addTGReturnStrategy, pTimeout, pTimeoutException } from "../utils";
import { storeBuyShare } from "../contracts/FriendZoneShare";

export async function handleBuyCommand(msg: TelegramBot.Message) {
  const groupChatId = msg.chat.id;
  // check if user specified amount to buy
  const amount = msg.text?.split(" ")[1];
  if (!amount) {
    await bot.sendMessage(
      groupChatId,
      "Please specify amount of shares to buy"
    );
    return;
  }

  if (msg.chat.type !== "group") {
    await bot.sendMessage(
      groupChatId,
      "This command is only available in groups"
    );
    return;
  }

  // get user's chatId
  const userChatId = await redisClient.get(`chat:${msg.from?.id}`);
  if (!userChatId) {
    await bot.sendMessage(
      groupChatId,
      "Private chat with bot not found, try connecting again with /connect"
    );
    return;
  }

  const connector = getConnector(+userChatId);
  await connector.restoreConnection();
  if (!connector.connected) {
    await bot.sendMessage(groupChatId, "Connect wallet to create group");
    return;
  }

  const wallet = connector.wallet;
  if (!wallet) {
    await bot.sendMessage(groupChatId, "Wallet not found");
    return;
  }

  pTimeout(
    connector.sendTransaction({
      validUntil: Math.round(
        (Date.now() + Number(process.env.DELETE_SEND_TX_MESSAGE_TIMEOUT_MS)) /
          1000
      ),
      network: CHAIN.TESTNET,
      messages: [
        {
          address: FRIENDZONE_CONTRACT_ADDRESS,
          amount: toNano("0.5").toString(), // TODO: add fee calculator
          payload: beginCell()
            .store(
              storeBuyShare({
                $$type: "BuyShare",
                amount: BigInt(amount),
                receiver: address(wallet.account.address),
              })
            )
            .endCell()
            .toBoc()
            .toString("base64"),
        },
      ],
    }),
    Number(process.env.DELETE_SEND_TX_MESSAGE_TIMEOUT_MS)
  )
    .then(() => {
      bot.sendMessage(groupChatId, "Group created");
    })
    .catch((e) => {
      if (e === pTimeoutException) {
        bot.sendMessage(groupChatId, `Transaction was not confirmed`);
        return;
      }

      if (e instanceof UserRejectsError) {
        bot.sendMessage(groupChatId, `You rejected the transaction`);
        return;
      }

      bot.sendMessage(groupChatId, `Unknown error happened`);
    })
    .finally(() => connector.pauseConnection());

  let deeplink = "";
  const walletInfo = await getWalletInfo(connector.wallet!.device.appName);
  if (walletInfo) {
    // @ts-ignore
    deeplink = walletInfo.universalLink;
  }
  if (isTelegramUrl(deeplink)) {
    const url = new URL(deeplink);
    url.searchParams.append("startattach", "tonconnect");
    deeplink = addTGReturnStrategy(
      url.toString(),
      process.env.TELEGRAM_BOT_LINK!
    );
  }

  await bot.sendMessage(
    groupChatId,
    `Open ${
      walletInfo?.name || connector.wallet!.device.appName
    } and confirm transaction`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `Open ${
                walletInfo?.name || connector.wallet!.device.appName
              }`,
              url: deeplink,
            },
          ],
        ],
      },
    }
  );
}
