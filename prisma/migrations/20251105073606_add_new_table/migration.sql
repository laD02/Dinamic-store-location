-- CreateTable
CREATE TABLE "Style" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "primaryColor" TEXT NOT NULL,
    "secondaryColor" TEXT NOT NULL,
    "primaryFont" TEXT NOT NULL,
    "secondaryFont" TEXT NOT NULL,
    "backgroundColor" TEXT NOT NULL,
    "corlor" TEXT NOT NULL,
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
