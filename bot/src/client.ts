import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

const apiId = process.env.TELEGRAM_APP_ID!;
const apiHash = process.env.TELEGRAM_APP_HASH!;
const botAuthToken = process.env.TELEGRAM_BOT_TOKEN!;
const stringSession = new StringSession(""); // fill this later with the value from session.save()

// export const client = new TelegramClient(stringSession, +apiId, apiHash, {
//   connectionRetries: 5,
// });

export async function startClient() {
  // await client.connect();
  // const botUser = await client.signInBot(
  //   {
  //     apiHash,
  //     apiId: +apiId,
  //   },
  //   {
  //     botAuthToken,
  //   }
  // );
  // console.log("Bot started as", botUser);
}
