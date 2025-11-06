/*
  Warnings:

  - You are about to drop the column `corlor` on the `Style` table. All the data in the column will be lost.
  - Added the required column `color` to the `Style` table without a default value. This is not possible if the table is not empty.

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
    "transparentcy" TEXT NOT NULL,
    "blur" INTEGER NOT NULL,
    "anchorx" INTEGER NOT NULL,
    "anchory" INTEGER NOT NULL,
    "connerRadius" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Style" ("anchorx", "anchory", "backgroundColor", "blur", "connerRadius", "createdAt", "iconColor", "id", "primaryColor", "primaryFont", "secondaryColor", "secondaryFont", "shadowColor", "transparentcy", "updatedAt") SELECT "anchorx", "anchory", "backgroundColor", "blur", "connerRadius", "createdAt", "iconColor", "id", "primaryColor", "primaryFont", "secondaryColor", "secondaryFont", "shadowColor", "transparentcy", "updatedAt" FROM "Style";
DROP TABLE "Style";
ALTER TABLE "new_Style" RENAME TO "Style";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
