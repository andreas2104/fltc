/*
  Warnings:

  - The primary key for the `Fees` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `FeesId` on the `Fees` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `Fees` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to drop the column `mounth` on the `Pay` table. All the data in the column will be lost.
  - You are about to drop the column `pay` on the `Pay` table. All the data in the column will be lost.
  - You are about to drop the column `firstname` on the `User` table. All the data in the column will be lost.
  - Added the required column `feesId` to the `Fees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `Fees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `Pay` table without a default value. This is not possible if the table is not empty.
  - Added the required column `feesId` to the `Pay` table without a default value. This is not possible if the table is not empty.
  - Added the required column `month` to the `Pay` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `Pay` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Fees" (
    "feesId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "price" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    CONSTRAINT "Fees_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Fees" ("price") SELECT "price" FROM "Fees";
DROP TABLE "Fees";
ALTER TABLE "new_Fees" RENAME TO "Fees";
CREATE TABLE "new_Pay" (
    "payId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "feesId" INTEGER NOT NULL,
    CONSTRAINT "Pay_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pay_feesId_fkey" FOREIGN KEY ("feesId") REFERENCES "Fees" ("feesId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Pay" ("payId") SELECT "payId" FROM "Pay";
DROP TABLE "Pay";
ALTER TABLE "new_Pay" RENAME TO "Pay";
CREATE TABLE "new_User" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" BOOLEAN NOT NULL,
    "centerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailVerified" DATETIME,
    CONSTRAINT "User_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center" ("centerId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("centerId", "contact", "createdAt", "email", "emailVerified", "name", "password", "role", "userId") SELECT "centerId", "contact", "createdAt", "email", "emailVerified", "name", "password", "role", "userId" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_contact_key" ON "User"("contact");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
