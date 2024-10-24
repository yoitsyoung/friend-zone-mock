import "dotenv/config";

import express from "express";
import { bot } from "./bot";
import { startClient } from "./client";
import { handleBuyCommand } from "./commands/buy";
import { handleSellCommand } from "./commands/sell";
import {
  createFriendZoneCallbacks,
  handleCreateCommand,
} from "./commands/create";
import { handleShowMyWalletCommand } from "./commands/wallet";
import { handleDisconnectCommand } from "./commands/disconnect";
import { handleConnectCommand } from "./commands/connect";
import { walletMenuCallbacks } from "./connect-wallet-menu";
import { initRedisClient } from "./ton-connect/storage";
import { prismaClient } from "./db";

const app = express();

app.get("/", (_, res) => {
  res.send("Health check!");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

async function main(): Promise<void> {
  await initRedisClient();
  await startClient();

  const callbacks = {
    ...walletMenuCallbacks,
    ...createFriendZoneCallbacks,
  };

  bot.on("callback_query", (query) => {
    if (!query.data) {
      return;
    }

    let request: { method: string; data: string };

    try {
      request = JSON.parse(query.data);
    } catch {
      return;
    }

    if (!callbacks[request.method as keyof typeof callbacks]) {
      return;
    }

    callbacks[request.method as keyof typeof callbacks](query, request.data);
  });

  console.log("Starting bot...");

  // Private chat commands
  bot.onText(/\/connect/, handleConnectCommand);
  bot.onText(/\/disconnect/, handleDisconnectCommand);
  bot.onText(/\/wallet/, handleShowMyWalletCommand);

  // Group chat commands
  bot.onText(/\/create/, handleCreateCommand);
  bot.onText(/\/sell/, handleSellCommand);
  bot.onText(/\/buy/, handleBuyCommand);
}

main()
  .then(() => {
    prismaClient.$disconnect();
  })
  .catch((error) => {
    prismaClient.$disconnect();
    console.error("Uncaught Error", error);
  });
