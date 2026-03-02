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

    const validEvents = ["SEARCH", "VIEW_STORE", "CLICK_DIRECTION", "CLICK_CALL"];
    if (!validEvents.includes(eventType)) {
      return new Response(JSON.stringify({ error: "Invalid event" }), { status: 400 });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (eventType === "SEARCH") {
      // Increment stats and track events for each store matched
      if (Array.isArray(storeIds) && storeIds.length > 0) {
        await Promise.all(
          storeIds.map(async (id) => {
            // Record an individual StoreEvent for each matched store
            await prisma.storeEvent.create({
              data: {
                shop,
                storeId: id,
                eventType,
                searchKeyword: searchKeyword || null,
                device: device || null,
                sessionId: sessionId || null,
              },
            });
            // We now use a cron job to aggregate StoreEvents into StoreDailyStat,
            // so we don't do real-time upserts here anymore.
          })
        );
      }
    } else {
      // Capture the single store event
      await prisma.storeEvent.create({
        data: {
          shop,
          storeId: storeId || null,
          eventType,
          searchKeyword: searchKeyword || null,
          device: device || null,
          sessionId: sessionId || null,
        },
      });

      // We now use a cron job to aggregate StoreEvents into StoreDailyStat,
      // so we don't do real-time upserts here anymore.
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