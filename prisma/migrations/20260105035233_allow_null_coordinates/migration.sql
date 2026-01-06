-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GeocodeCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "lat" REAL,
    "lng" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_GeocodeCache" ("address", "createdAt", "hitCount", "id", "lat", "lng", "updatedAt") SELECT "address", "createdAt", "hitCount", "id", "lat", "lng", "updatedAt" FROM "GeocodeCache";
DROP TABLE "GeocodeCache";
ALTER TABLE "new_GeocodeCache" RENAME TO "GeocodeCache";
CREATE UNIQUE INDEX "GeocodeCache_address_key" ON "GeocodeCache"("address");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
