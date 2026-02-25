-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'TIMED_OUT');

-- CreateEnum
CREATE TYPE "BalanceQueryStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'TIMED_OUT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "commandId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "partyA" TEXT NOT NULL,
    "partyB" TEXT NOT NULL,
    "remarks" TEXT,
    "occasion" TEXT,
    "conversationId" TEXT,
    "originatorConversationId" TEXT,
    "mpesaTransactionId" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "resultCode" INTEGER,
    "resultDesc" TEXT,
    "recipientName" TEXT,
    "isRegisteredCustomer" BOOLEAN,
    "chargesAccountBalance" DECIMAL(12,2),
    "utilityAccountBalance" DECIMAL(12,2),
    "workingAccountBalance" DECIMAL(12,2),
    "completedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balance_snapshots" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shortcode" TEXT NOT NULL,
    "utilityAccountBalance" DECIMAL(12,2),
    "workingAccountBalance" DECIMAL(12,2),
    "chargesAccountBalance" DECIMAL(12,2),
    "conversationId" TEXT,
    "originatorConversationId" TEXT,
    "resultCode" INTEGER,
    "resultDesc" TEXT,
    "status" "BalanceQueryStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "balance_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_conversationId_key" ON "transactions"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_originatorConversationId_key" ON "transactions"("originatorConversationId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_mpesaTransactionId_key" ON "transactions"("mpesaTransactionId");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_partyB_idx" ON "transactions"("partyB");

-- CreateIndex
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "balance_snapshots_conversationId_key" ON "balance_snapshots"("conversationId");

-- CreateIndex
CREATE INDEX "balance_snapshots_shortcode_idx" ON "balance_snapshots"("shortcode");

-- CreateIndex
CREATE INDEX "balance_snapshots_createdAt_idx" ON "balance_snapshots"("createdAt");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
