/*
  Warnings:

  - A unique constraint covering the columns `[chatId]` on the table `CreateGroupRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CreateGroupRequest_chatId_key" ON "CreateGroupRequest"("chatId");
