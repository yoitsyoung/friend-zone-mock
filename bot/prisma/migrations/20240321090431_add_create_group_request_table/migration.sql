-- CreateTable
CREATE TABLE "CreateGroupRequest" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "chatId" TEXT NOT NULL,
    "walletAddresses" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreateGroupRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CreateGroupRequest" ADD CONSTRAINT "CreateGroupRequest_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
