-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "studentId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "identity" TEXT,
    "promotion" TEXT NOT NULL DEFAULT 'Unknown',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Student" ("contact", "createdAt", "firstName", "identity", "name", "status", "studentId") SELECT "contact", "createdAt", "firstName", "identity", "name", "status", "studentId" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_contact_key" ON "Student"("contact");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
