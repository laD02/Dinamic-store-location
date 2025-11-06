/*
  Warnings:

  - Made the column `cornerRadius` on table `Style` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Style" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "primaryColor" TEXT NOT NULL,
    "secondaryColor" TEXT NOT NULL,
    "primaryFont" TEXT NOT NULL,
    "secondaryFont" TEXT NOT NULL,
    "backgroundColor" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "iconColor" TEXT NOT NULL,
    "shadowColor" TEXT NOT NULL,
    "transparency" INTEGER NOT NULL,
    "blur" INTEGER NOT NULL,
    "anchorx" INTEGER NOT NULL,
    "anchory" INTEGER NOT NULL,
    "cornerRadius" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Style" ("anchorx", "anchory", "backgroundColor", "blur", "color", "cornerRadius", "createdAt", "iconColor", "id", "primaryColor", "primaryFont", "secondaryColor", "secondaryFont", "shadowColor", "transparency", "updatedAt") SELECT "anchorx", "anchory", "backgroundColor", "blur", "color", "cornerRadius", "createdAt", "iconColor", "id", "primaryColor", "primaryFont", "secondaryColor", "secondaryFont", "shadowColor", "transparency", "updatedAt" FROM "Style";
DROP TABLE "Style";
ALTER TABLE "new_Style" RENAME TO "Style";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
