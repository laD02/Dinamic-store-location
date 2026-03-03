import prisma from "app/db.server";
import { authenticate } from "../shopify.server";
import { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  let shop: string | undefined;

  try {
    const { session } = await authenticate.admin(request);
    shop = session?.shop;
  } catch {
    const url = new URL(request.url);
    shop = url.searchParams.get("shop") ?? undefined;
  }

  if (!shop) {
    return new Response(JSON.stringify({ stores: [], style: null }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // 1️⃣ Lấy các shop connect tới shop hiện tại
  const connections = await prisma.shopConnection.findMany({
    where: { targetShop: shop },
    select: { sourceShop: true },
  });

  const sourceShops = connections.map((c) => c.sourceShop);

  // 2️⃣ Lấy store của shop chính + shop connect
  const stores = await prisma.store.findMany({
    where: {
      AND: [
        {
          OR: [
            { shop },
            ...(sourceShops.length ? [{ shop: { in: sourceShops } }] : []),
          ],
        },
        { visibility: "visible" },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const style =
    (await prisma.style.findFirst({
      where: { shop },
    })) || {
      primaryColor: "#000",
      secondaryColor: "#000",
      primaryFont: "Roboto",
      secondaryFont: "Open Sans",
      color: "#000",
    };

  return new Response(
    JSON.stringify({ stores, style }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response(JSON.stringify({ error: "Missing shop" }), { status: 400 });
  }

  try {
    const body = await request.json();
    const { eventType, storeId, storeIds, searchKeyword, device, sessionId } = body;

    const validEvents = ["SEARCH", "VIEW_STORE", "CLICK_DIRECTION", "CLICK_CALL", "CLICK_WEBSITE"];
    if (!validEvents.includes(eventType)) {
      return new Response(JSON.stringify({ error: "Invalid event" }), { status: 400 });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (eventType === "SEARCH") {
      if (Array.isArray(storeIds) && storeIds.length > 0) {
        // Fetch the actual shop owner for each store
        const stores = await prisma.store.findMany({
          where: { id: { in: storeIds } },
          select: { id: true, shop: true },
        });

        const storeShopMap = new Map(stores.map((s) => [s.id, s.shop]));

        await Promise.all(
          storeIds.map(async (id) => {
            const storeShop = storeShopMap.get(id) ?? shop;
            await prisma.storeEvent.create({
              data: {
                shop: storeShop, // ✅ shop chứa store, không phải shop đang xem
                storeId: id,
                eventType,
                searchKeyword: searchKeyword || null,
                device: device || null,
                sessionId: sessionId || null,
              },
            });
          })
        );
      }
    } else {
      // Fetch the actual shop owner of this store
      let storeShop = shop;
      if (storeId) {
        const storeRecord = await prisma.store.findUnique({
          where: { id: storeId },
          select: { shop: true },
        });
        if (storeRecord) storeShop = storeRecord.shop;
      }

      await prisma.storeEvent.create({
        data: {
          shop: storeShop, // ✅ shop chứa store, không phải shop đang xem
          storeId: storeId || null,
          eventType,
          searchKeyword: searchKeyword || null,
          device: device || null,
          sessionId: sessionId || null,
        },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Tracking error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
}