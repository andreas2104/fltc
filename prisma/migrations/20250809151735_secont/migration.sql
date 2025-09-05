/*
  Warnings:

  - The primary key for the `Center` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Center` table. All the data in the column will be lost.
  - The primary key for the `Fees` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Fees` table. All the data in the column will be lost.
  - The primary key for the `Pay` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Pay` table. All the data in the column will be lost.
  - The primary key for the `Student` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Student` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `fisrtname` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastname` on the `User` table. All the data in the column will be lost.
  - Added the required column `centerId` to the `Center` table without a default value. This is not possible if the table is not empty.
  - Added the required column `FeesId` to the `Fees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payId` to the `Pay` table without a default value. This is not possible if the table is not empty.
  - Added the required column `centerId` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `centerId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstname` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.
  - The required column `userId` was added to the `User` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Center" (
    "centerId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "city" TEXT NOT NULL
);
INSERT INTO "new_Center" ("city") SELECT "city" FROM "Center";
DROP TABLE "Center";
ALTER TABLE "new_Center" RENAME TO "Center";
CREATE TABLE "new_Fees" (
    "FeesId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "price" TEXT NOT NULL
);
INSERT INTO "new_Fees" ("price") SELECT "price" FROM "Fees";
DROP TABLE "Fees";
ALTER TABLE "new_Fees" RENAME TO "Fees";
CREATE TABLE "new_Pay" (
    "payId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pay" TEXT NOT NULL,
    "mounth" TEXT NOT NULL
);
INSERT INTO "new_Pay" ("mounth", "pay") SELECT "mounth", "pay" FROM "Pay";
DROP TABLE "Pay";
ALTER TABLE "new_Pay" RENAME TO "Pay";
CREATE TABLE "new_Student" (
    "studentId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "centerId" INTEGER NOT NULL,
    CONSTRAINT "Student_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center" ("centerId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("contact", "firstName", "identity", "name") SELECT "contact", "firstName", "identity", "name" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE TABLE "new_User" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" BOOLEAN NOT NULL,
    "centerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailVerified" DATETIME,
    CONSTRAINT "User_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center" ("centerId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("contact", "createdAt", "email", "emailVerified", "password", "role") SELECT "contact", "createdAt", "email", "emailVerified", "password", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_contact_key" ON "User"("contact");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
