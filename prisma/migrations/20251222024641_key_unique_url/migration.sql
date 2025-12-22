-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Key" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "ggKey" TEXT NOT NULL DEFAULT '',
    "b2bKey" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Key" ("b2bKey", "ggKey", "id", "url") SELECT "b2bKey", "ggKey", "id", "url" FROM "Key";
DROP TABLE "Key";
ALTER TABLE "new_Key" RENAME TO "Key";
CREATE UNIQUE INDEX "Key_url_key" ON "Key"("url");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
