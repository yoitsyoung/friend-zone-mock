import Head from 'next/head';
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "FriendZone",
  description: "Create your FriendZone on Telegram now.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
    <Head>
        <script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive"></script>
    </Head>
    <html lang="en">
      <script src="https://telegram.org/js/telegram-web-app.js"></script>
      <body className={fontSans.className}>{children}</body>
    </html>
    </>
  );
}
