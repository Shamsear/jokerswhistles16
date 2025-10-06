/*
  Warnings:

  - You are about to drop the column `description` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `tasks` table. All the data in the column will be lost.
  - Added the required column `awayDescription` to the `tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `homeDescription` to the `tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "description",
DROP COLUMN "type",
ADD COLUMN     "awayDescription" TEXT NOT NULL,
ADD COLUMN     "homeDescription" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;
