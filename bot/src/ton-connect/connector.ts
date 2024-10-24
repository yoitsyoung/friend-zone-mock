import TonConnect from "@tonconnect/sdk";
import { TonConnectStorage } from "./storage";

export function getConnector(chatId: number): TonConnect {
  return new TonConnect({
    manifestUrl: process.env.MANIFEST_URL,
    storage: new TonConnectStorage(chatId),
  });
}
