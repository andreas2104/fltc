/*
  Warnings:

  - You are about to drop the `Center` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `centerId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `centerId` on the `User` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Center";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Fees" (
    "feesId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "price" INTEGER NOT NULL,
    "feeType" TEXT NOT NULL DEFAULT 'DROITS_ANNUELS',
    "month" TEXT,
    "studentId" INTEGER NOT NULL,
    CONSTRAINT "Fees_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Fees" ("feesId", "price", "studentId") SELECT "feesId", "price", "studentId" FROM "Fees";
DROP TABLE "Fees";
ALTER TABLE "new_Fees" RENAME TO "Fees";
CREATE INDEX "Fees_studentId_feeType_idx" ON "Fees"("studentId", "feeType");
CREATE TABLE "new_Pay" (
    "payId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "feesId" INTEGER NOT NULL,
    CONSTRAINT "Pay_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pay_feesId_fkey" FOREIGN KEY ("feesId") REFERENCES "Fees" ("feesId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Pay" ("amount", "feesId", "month", "payId", "studentId") SELECT "amount", "feesId", "month", "payId", "studentId" FROM "Pay";
DROP TABLE "Pay";
ALTER TABLE "new_Pay" RENAME TO "Pay";
CREATE INDEX "Pay_studentId_month_idx" ON "Pay"("studentId", "month");
CREATE INDEX "Pay_feesId_idx" ON "Pay"("feesId");
CREATE TABLE "new_Student" (
    "studentId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Student" ("contact", "firstName", "identity", "name", "studentId") SELECT "contact", "firstName", "identity", "name", "studentId" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE TABLE "new_User" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailVerified" DATETIME
);
INSERT INTO "new_User" ("contact", "createdAt", "email", "emailVerified", "firstName", "name", "password", "role", "userId") SELECT "contact", "createdAt", "email", "emailVerified", "firstName", "name", "password", "role", "userId" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_contact_key" ON "User"("contact");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
