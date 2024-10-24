import TelegramBot, { CallbackQuery } from "node-telegram-bot-api";
import { bot } from "../bot";
import { prismaClient } from "../db";
import { FRIENDZONE_CONTRACT_ADDRESS } from "../constants";
import { Address, Cell, beginCell, toNano } from "@ton/core";
import { CHAIN, UserRejectsError, isTelegramUrl } from "@tonconnect/sdk";
import { getWalletInfo } from "../ton-connect/wallets";
import { pTimeout, pTimeoutException, addTGReturnStrategy } from "../utils";
import { storeBuyShare } from "../contracts/FriendZoneShare";
import { getConnector } from "../ton-connect/connector";
import { storeCreateShare } from "../contracts/FriendZone";

export const createFriendZoneCallbacks = {
  join_group: onJoinOrLeaveGroup,
  confirm_group: onConfirmGroup,
};

const KEYBOARD = [
  {
    text: "Join/Leave",
    callback_data: JSON.stringify({
      method: "join_group",
    }),
  },
  {
    text: "Confirm (only for initiator)",
    callback_data: JSON.stringify({
      method: "confirm_group",
    }),
  },
];

async function onConfirmGroup(query: CallbackQuery) {
  const groupChatId = query.message?.chat.id;
  if (!groupChatId) {
    await bot.sendMessage(
      query.message?.chat.id!,
      "This command is only available in groups"
    );
    return;
  }

  const user = await prismaClient.user.findFirst({
    where: {
      telegramId: query.from.id.toString(),
    },
  });
  if (user === null || user.walletAddress === null) {
    await bot.sendMessage(
      groupChatId,
      "User not found, try connecting again by PM-ing the bot with /connect"
    );
    return;
  }

  const connector = getConnector(+user.privateChatId);
  await connector.restoreConnection();

  // TODO: batch into 4 messages per transaction
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
              storeCreateShare({
                $$type: "CreateShare",
                chatId: BigInt(groupChatId),
                content: Cell.EMPTY,
                owner: Address.parse(user.walletAddress),
                shareFeePercent: BigInt(0), // TODO: allow user to customise
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
    .then((e) => {
      console.log("send transaction response", e);
      bot.sendMessage(groupChatId, "Group share created!");
    })
    .catch((e) => {
      if (e === pTimeoutException) {
        bot.sendMessage(user.privateChatId, `Transaction was not confirmed`);
        return;
      }

      if (e instanceof UserRejectsError) {
        bot.sendMessage(user.privateChatId, `You rejected the transaction`);
        return;
      }

      bot.sendMessage(user.privateChatId, `Unknown error happened`);
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
    user.privateChatId,
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

async function onJoinOrLeaveGroup(query: CallbackQuery): Promise<void> {
  const chatId = query.message?.chat.id;
  if (!chatId) {
    return;
  }

  const createGroupRequest = await prismaClient.createGroupRequest.findFirst({
    where: {
      chat: {
        chatId: chatId.toString(),
      },
    },
    include: {
      users: true,
    },
  });

  if (!createGroupRequest) {
    console.error("Group request not found for id", chatId);
    await bot.sendMessage(chatId, "Group request not found");
    return;
  }
  const user = await prismaClient.user.findFirst({
    where: {
      telegramId: query.from.id.toString(),
    },
  });
  if (user === null || user.walletAddress === null) {
    await bot.sendMessage(
      chatId,
      `@${query.from.username}, please connect wallet to join the group with /connect`
    );
    return;
  }
  let users = createGroupRequest.users;
  if (createGroupRequest.users.some((u) => u.id === user.id)) {
    await prismaClient.createGroupRequest.update({
      where: {
        id: createGroupRequest.id,
      },
      data: {
        users: {
          disconnect: {
            id: user.id,
          },
        },
      },
    });
    users = users.filter((u) => u.id !== user.id);

    await bot.sendMessage(chatId, `@${user.username} left the group`);
    if (query.message?.message_id) {
      await bot.editMessageText(
        `Group creation in progress, interested members can join by pressing the button below\\.\nCurrent members:\n\n${users
          .map((u) => `\\- @${u.username}`)
          .join("\n")}`,
        {
          parse_mode: "MarkdownV2",
          chat_id: chatId,
          message_id: query.message.message_id,
          reply_markup: {
            inline_keyboard: [KEYBOARD],
          },
        }
      );
    }
    return;
  }

  await prismaClient.createGroupRequest.update({
    where: {
      id: createGroupRequest.id,
    },
    data: {
      users: {
        connect: {
          id: user.id,
        },
      },
    },
  });
  users.push(user);

  await bot.sendMessage(chatId, `@${user.username} joined the group`);
  if (query.message?.message_id) {
    await bot.editMessageText(
      `Group creation in progress, interested members can join by pressing the button below\\.\nCurrent members:\n\n${users
        .map((u) => `\\- @${u.username}`)
        .join("\n")}`,
      {
        message_id: query.message.message_id,
        chat_id: chatId,
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [KEYBOARD],
        },
      }
    );
  }
}

export async function handleCreateCommand(msg: TelegramBot.Message) {
  const groupChatId = msg.chat.id;
  if (msg.chat.type !== "group") {
    await bot.sendMessage(
      groupChatId,
      "This command is only available in groups"
    );
    return;
  }

  // get user's chatId
  const user = await prismaClient.user.findFirst({
    where: {
      telegramId: String(msg.from?.id),
    },
  });
  if (user === null) {
    await bot.sendMessage(
      groupChatId,
      "User not found, try connecting again by PM-ing the bot with /connect"
    );
    return;
  }

  const chat = await prismaClient.chat.upsert({
    where: {
      chatId: groupChatId.toString(),
    },
    create: {
      chatId: groupChatId.toString(),
      chatOwnerId: user.id, // TODO: make sure initializer is chat owner
    },
    update: {},
  });

  const createGroupRequest = await prismaClient.createGroupRequest.findFirst({
    where: {
      chatId: chat.id,
    },
    include: {
      users: true,
    },
  });
  if (createGroupRequest?.status === "success") {
    await bot.sendMessage(groupChatId, "Group already created!");
    return;
  }

  if (createGroupRequest === null) {
    await prismaClient.createGroupRequest.create({
      data: {
        chatId: chat.id,
        users: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    await bot.sendMessage(
      groupChatId,
      "Group creation request sent, interested members can join by pressing the button below! Make sure you are connected with /connect first!",
      {
        reply_markup: {
          inline_keyboard: [KEYBOARD],
        },
      }
    );
    return;
  }
  await bot.sendMessage(
    groupChatId,
    `Group creation in progress, interested members can join by pressing the button below\\.\nCurrent members:\n${createGroupRequest.users
      .map((u) => `\\- @${u.username}`)
      .join("\n")}`,
    {
      parse_mode: "MarkdownV2",
      reply_markup: {
        inline_keyboard: [KEYBOARD],
      },
    }
  );
}
