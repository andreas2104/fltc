-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fisrtname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailVerified" DATETIME
);

-- CreateTable
CREATE TABLE "Center" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "city" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "identity" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Fees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "price" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Pay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pay" TEXT NOT NULL,
    "mounth" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_contact_key" ON "User"("contact");
