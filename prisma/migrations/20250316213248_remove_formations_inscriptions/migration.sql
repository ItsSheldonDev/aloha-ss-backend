/*
  Warnings:

  - The values [INSCRIPTION,CONTACT,NOTIFICATION] on the enum `EmailType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Formation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Inscription` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EmailType_new" AS ENUM ('NOTIFICATION_SAUVE_TAGE_SPORTIF', 'CONFIRMATION_CONTACT', 'NOTIFICATION_CONTACT', 'CONFIRMATION_SIGNALEMENT', 'NOTIFICATION_SIGNALEMENT');
ALTER TABLE "EmailTemplate" ALTER COLUMN "type" TYPE "EmailType_new" USING ("type"::text::"EmailType_new");
ALTER TYPE "EmailType" RENAME TO "EmailType_old";
ALTER TYPE "EmailType_new" RENAME TO "EmailType";
DROP TYPE "EmailType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Inscription" DROP CONSTRAINT "Inscription_formationId_fkey";

-- DropTable
DROP TABLE "Formation";

-- DropTable
DROP TABLE "Inscription";

-- DropEnum
DROP TYPE "StatutFormation";

-- DropEnum
DROP TYPE "StatutInscription";

-- DropEnum
DROP TYPE "TypeFormation";
