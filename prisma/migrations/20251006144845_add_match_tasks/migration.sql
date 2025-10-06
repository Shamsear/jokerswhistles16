-- CreateTable
CREATE TABLE "match_tasks" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerType" TEXT NOT NULL,
    "cardNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "match_tasks_matchId_playerId_key" ON "match_tasks"("matchId", "playerId");

-- AddForeignKey
ALTER TABLE "match_tasks" ADD CONSTRAINT "match_tasks_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_tasks" ADD CONSTRAINT "match_tasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
