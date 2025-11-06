/*
  Warnings:

  - You are about to drop the column `connerRadius` on the `Style` table. All the data in the column will be lost.
  - You are about to alter the column `transparency` on the `Style` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

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
    "cornerRadius" INTEGER DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Style" ("anchorx", "anchory", "backgroundColor", "blur", "color", "createdAt", "iconColor", "id", "primaryColor", "primaryFont", "secondaryColor", "secondaryFont", "shadowColor", "transparency", "updatedAt") SELECT "anchorx", "anchory", "backgroundColor", "blur", "color", "createdAt", "iconColor", "id", "primaryColor", "primaryFont", "secondaryColor", "secondaryFont", "shadowColor", "transparency", "updatedAt" FROM "Style";
DROP TABLE "Style";
ALTER TABLE "new_Style" RENAME TO "Style";

