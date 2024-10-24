/*
  Warnings:

  - You are about to drop the column `walletAddresses` on the `CreateGroupRequest` table. All the data in the column will be lost.
  - You are about to drop the `ChatUsers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChatUsers" DROP CONSTRAINT "ChatUsers_chatId_fkey";

-- DropForeignKey
ALTER TABLE "ChatUsers" DROP CONSTRAINT "ChatUsers_userId_fkey";

-- AlterTable
ALTER TABLE "CreateGroupRequest" DROP COLUMN "walletAddresses";

-- DropTable
DROP TABLE "ChatUsers";

-- CreateTable
CREATE TABLE "_ChatToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CreateGroupRequestToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ChatToUser_AB_unique" ON "_ChatToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ChatToUser_B_index" ON "_ChatToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CreateGroupRequestToUser_AB_unique" ON "_CreateGroupRequestToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_CreateGroupRequestToUser_B_index" ON "_CreateGroupRequestToUser"("B");

-- AddForeignKey
ALTER TABLE "_ChatToUser" ADD CONSTRAINT "_ChatToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatToUser" ADD CONSTRAINT "_ChatToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CreateGroupRequestToUser" ADD CONSTRAINT "_CreateGroupRequestToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "CreateGroupRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CreateGroupRequestToUser" ADD CONSTRAINT "_CreateGroupRequestToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
