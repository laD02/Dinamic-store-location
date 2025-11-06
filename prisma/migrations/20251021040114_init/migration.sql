-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "contract" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "visibility" TEXT NOT NULL,
    "time" JSONB NOT NULL
);
