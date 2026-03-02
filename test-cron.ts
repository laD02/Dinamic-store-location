import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const store = await prisma.store.findFirst()
  console.log("Found store:", store)

  const shop = store?.shop || "test-shop.myshopify.com"

  const event1 = await prisma.storeEvent.create({
    data: {
      shop,
      storeId: store?.id,
      eventType: "SEARCH",
      searchKeyword: "test search"
    }
  })

  const event2 = await prisma.storeEvent.create({
    data: {
      shop,
      storeId: store?.id,
      eventType: "VIEW_STORE"
    }
  })

  const event3 = await prisma.storeEvent.create({
    data: {
      shop,
      storeId: null,
      eventType: "SEARCH",
      searchKeyword: "general search"
    }
  })

  console.log("Created test events", [event1.id, event2.id, event3.id])
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
