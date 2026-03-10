/*
  Warnings:

  - You are about to drop the `Attribute` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `source` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `colorMaker` on the `Style` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `Style` table. All the data in the column will be lost.
  - You are about to drop the column `styleMaker` on the `Style` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `Style` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Plan` table without a default value. This is not possible if the table is not empty.
  - Made the column `shop` on table `Plan` required. This step will fail if there are existing NULL values in that column.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Attribute";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ShopConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceShop" TEXT NOT NULL,
    "targetShop" TEXT NOT NULL,
    "sourceShopUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StoreEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "storeId" TEXT,
    "sessionId" TEXT,
    "eventType" TEXT NOT NULL,
    "searchKeyword" TEXT,
    "country" TEXT,
    "city" TEXT,
    "device" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoreEvent_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoreDailyStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "storeId" TEXT,
    "date" DATETIME NOT NULL,
    "uniqueSessions" INTEGER NOT NULL,
    "uniqueViewSessions" INTEGER NOT NULL DEFAULT 0,
    "uniqueSearchSessions" INTEGER NOT NULL DEFAULT 0,
    "uniqueDirectionSessions" INTEGER NOT NULL DEFAULT 0,
    "uniqueCallSessions" INTEGER NOT NULL DEFAULT 0,
    "uniqueWebsiteSessions" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "StoreDailyStat_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoreSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "date" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReportSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL DEFAULT 'Monday',
    "dayOfMonth" INTEGER NOT NULL DEFAULT 1,
    "dailyTime" TEXT NOT NULL DEFAULT '09:00',
    "weeklyTime" TEXT NOT NULL DEFAULT '09:00',
    "monthlyTime" TEXT NOT NULL DEFAULT '09:00',
    "inAppDaily" BOOLEAN NOT NULL DEFAULT false,
    "inAppWeekly" BOOLEAN NOT NULL DEFAULT false,
    "inAppMonthly" BOOLEAN NOT NULL DEFAULT false,
    "lastDailySentAt" DATETIME,
    "lastWeeklySentAt" DATETIME,
    "lastMonthlySentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Key" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "b2bKey" TEXT
);
INSERT INTO "new_Key" ("b2bKey", "id", "shop") SELECT "b2bKey", "id", "shop" FROM "Key";
DROP TABLE "Key";
ALTER TABLE "new_Key" RENAME TO "Key";
CREATE UNIQUE INDEX "Key_shop_key" ON "Key"("shop");
CREATE UNIQUE INDEX "Key_b2bKey_key" ON "Key"("b2bKey");
CREATE TABLE "new_Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'basic',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Plan" ("id", "level", "shop") SELECT "id", "level", "shop" FROM "Plan";
DROP TABLE "Plan";
ALTER TABLE "new_Plan" RENAME TO "Plan";
CREATE UNIQUE INDEX "Plan_shop_key" ON "Plan"("shop");
CREATE TABLE "new_Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "region" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "phone" TEXT,
    "image" TEXT,
    "url" TEXT,
    "directions" TEXT,
    "contract" JSONB,
    "visibility" TEXT NOT NULL,
    "time" JSONB,
    "tags" JSONB,
    "lat" REAL,
    "lng" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Store" ("address", "city", "code", "contract", "createdAt", "directions", "id", "image", "lat", "lng", "phone", "region", "shop", "state", "storeName", "tags", "time", "updatedAt", "url", "visibility") SELECT "address", "city", "code", "contract", "createdAt", "directions", "id", "image", "lat", "lng", "phone", "region", "shop", "state", "storeName", "tags", "time", "updatedAt", "url", "visibility" FROM "Store";
DROP TABLE "Store";
ALTER TABLE "new_Store" RENAME TO "Store";
CREATE TABLE "new_Style" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
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
INSERT INTO "new_Style" ("anchorx", "anchory", "backgroundColor", "blur", "color", "cornerRadius", "createdAt", "iconColor", "id", "primaryColor", "primaryFont", "secondaryColor", "secondaryFont", "shadowColor", "shop", "transparency", "updatedAt") SELECT "anchorx", "anchory", "backgroundColor", "blur", "color", "cornerRadius", "createdAt", "iconColor", "id", "primaryColor", "primaryFont", "secondaryColor", "secondaryFont", "shadowColor", "shop", "transparency", "updatedAt" FROM "Style";
DROP TABLE "Style";
ALTER TABLE "new_Style" RENAME TO "Style";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ShopConnection_sourceShop_targetShop_key" ON "ShopConnection"("sourceShop", "targetShop");

-- CreateIndex
CREATE INDEX "StoreEvent_shop_idx" ON "StoreEvent"("shop");

-- CreateIndex
CREATE INDEX "StoreEvent_storeId_idx" ON "StoreEvent"("storeId");

-- CreateIndex
CREATE INDEX "StoreEvent_eventType_idx" ON "StoreEvent"("eventType");

-- CreateIndex
CREATE INDEX "StoreEvent_createdAt_idx" ON "StoreEvent"("createdAt");

-- CreateIndex
CREATE INDEX "StoreDailyStat_shop_storeId_date_idx" ON "StoreDailyStat"("shop", "storeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StoreDailyStat_shop_storeId_date_key" ON "StoreDailyStat"("shop", "storeId", "date");

-- CreateIndex
CREATE INDEX "StoreSession_shop_storeId_date_idx" ON "StoreSession"("shop", "storeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StoreSession_shop_storeId_sessionId_date_key" ON "StoreSession"("shop", "storeId", "sessionId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSetting_shop_key" ON "ReportSetting"("shop");

-- CreateIndex
CREATE INDEX "Notification_shop_idx" ON "Notification"("shop");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");
