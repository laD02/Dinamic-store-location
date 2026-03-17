import prisma from "app/db.server";
import { authenticate } from "../shopify.server";
import { getEffectiveLevel } from "../utils/plan.server";
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
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const level = await getEffectiveLevel(shop);
  const isPlus = level === 'plus';

  let sourceShops: string[] = [];
  if (isPlus) {
    const connections = await prisma.shopConnection.findMany({
      where: { targetShop: shop },
      select: { sourceShop: true },
    });
    sourceShops = connections.map((c) => c.sourceShop);
  }

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
    orderBy: { createdAt: "desc" },
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Calculate total activity for each store
  const stats = await prisma.storeDailyStat.groupBy({
    by: ['storeId'],
    where: {
      storeId: { in: stores.map(s => s.id) },
      date: { gte: thirtyDaysAgo }
    },
    _sum: {
      uniqueSessions: true,
      uniqueViewSessions: true,
      uniqueSearchSessions: true,
      uniqueDirectionSessions: true,
      uniqueCallSessions: true,
      uniqueWebsiteSessions: true
    }
  });

  const statsMap = new Map(stats.map(s => [
    s.storeId,
    (s._sum.uniqueViewSessions || 0) * 1 +
    (s._sum.uniqueSearchSessions || 0) * 2 +
    (s._sum.uniqueWebsiteSessions || 0) * 3 +
    (s._sum.uniqueCallSessions || 0) * 4 +
    (s._sum.uniqueDirectionSessions || 0) * 5
  ]));

  const storesWithStats = stores.map(store => ({
    ...store,
    totalActivity: statsMap.get(store.id) || 0
  }));

  const style =
    (await prisma.style.findFirst({ where: { shop } })) || {
      primaryColor: "#000",
      secondaryColor: "#000",
      primaryFont: "Roboto",
      secondaryFont: "Open Sans",
      color: "#000",
      markerIcon: null,
      mapStyle: "[]",
    };

  // Apply soft gating for Basic plan
  if (level === 'basic') {
    (style as any).markerIcon = null;
    (style as any).mapStyle = "[]";
  }

  return new Response(JSON.stringify({ stores: storesWithStats, style }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EVENT_FIELD_MAP: Record<string, string> = {
  VIEW_STORE: "uniqueViewSessions",
  SEARCH: "uniqueSearchSessions",
  CLICK_DIRECTION: "uniqueDirectionSessions",
  CLICK_CALL: "uniqueCallSessions",
  CLICK_WEBSITE: "uniqueWebsiteSessions",
};

const VALID_EVENTS = Object.keys(EVENT_FIELD_MAP);

async function trackSingleStore(
  tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  params: {
    shop: string;
    storeId: string | null;
    eventType: string;
    searchKeyword?: string | null;
    device?: string | null;
    sessionId?: string | null;
    date: Date;
  }
) {
  const { shop, storeId, eventType, searchKeyword, device, sessionId, date } = params;

  // 1️⃣ Luôn lưu raw event
  await tx.storeEvent.create({
    data: {
      shop,
      storeId: storeId || null,
      eventType: eventType as any,
      searchKeyword: searchKeyword || null,
      device: device || null,
      sessionId: sessionId || null,
    },
  });

  // Thiếu sessionId hoặc storeId → không cần tracking session
  if (!sessionId || !storeId) return;

  const nextDay = new Date(date);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  // 2️⃣ Upsert StoreDailyStat — đảm bảo row tồn tại trước khi update
  await tx.storeDailyStat.upsert({
    where: { shop_storeId_date: { shop, storeId, date } },
    create: { shop, storeId, date, uniqueSessions: 0 },
    update: {},
  });

  // 3️⃣ Kiểm tra StoreSession — đại diện cho "session tổng" của store trong ngày
  const existingSession = await tx.storeSession.findUnique({
    where: { shop_storeId_sessionId_date: { shop, storeId, sessionId, date } },
  });

  if (!existingSession) {
    await tx.storeSession.create({
      data: { shop, storeId, sessionId, date },
    });

    await tx.storeDailyStat.update({
      where: { shop_storeId_date: { shop, storeId, date } },
      data: { uniqueSessions: { increment: 1 } },
    });
  }

  // 4️⃣ Kiểm tra xem (sessionId + storeId + eventType) đã từng xảy ra hôm nay chưa
  //    dựa vào StoreEvent (raw log). Vì raw event vừa được tạo ở bước 1,
  //    nên nếu count > 1 → đã có từ trước → bỏ qua.
  const eventCountToday = await tx.storeEvent.count({
    where: {
      shop,
      storeId,
      sessionId,
      eventType: eventType as any,
      createdAt: { gte: date, lt: nextDay },
    },
  });

  if (eventCountToday === 1) {
    // Lần đầu tiên session này trigger eventType này hôm nay → tăng counter
    const field = EVENT_FIELD_MAP[eventType];
    if (field) {
      await tx.storeDailyStat.update({
        where: { shop_storeId_date: { shop, storeId, date } },
        data: { [field]: { increment: 1 } },
      });
    }
  }
  // Nếu count > 1 → đã đếm rồi, bỏ qua
}

// ─── Action ──────────────────────────────────────────────────────────────────

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

    const level = await getEffectiveLevel(shop);
    if (level === 'basic') {
      return new Response(JSON.stringify({ success: true, masked: true }), {
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      });
    }

    if (!VALID_EVENTS.includes(eventType)) {
      return new Response(JSON.stringify({ error: "Invalid event" }), { status: 400 });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (eventType === "SEARCH") {
      // SEARCH: có thể ảnh hưởng nhiều store cùng lúc (qua storeIds)
      if (Array.isArray(storeIds) && storeIds.length > 0) {
        const stores = await prisma.store.findMany({
          where: { id: { in: storeIds } },
          select: { id: true, shop: true },
        });

        const storeShopMap = new Map(stores.map((s) => [s.id, s.shop]));

        await prisma.$transaction(async (tx) => {
          await Promise.all(
            storeIds.map((id) =>
              trackSingleStore(tx, {
                shop: storeShopMap.get(id) ?? shop,
                storeId: id,
                eventType,
                searchKeyword,
                device,
                sessionId,
                date: today,
              })
            )
          );
        });
      }
    } else {
      // Các event khác: một store duy nhất
      let storeShop = shop;
      if (storeId) {
        const storeRecord = await prisma.store.findUnique({
          where: { id: storeId },
          select: { shop: true },
        });
        if (storeRecord) storeShop = storeRecord.shop;
      }

      await prisma.$transaction((tx) =>
        trackSingleStore(tx, {
          shop: storeShop,
          storeId: storeId || null,
          eventType,
          searchKeyword,
          device,
          sessionId,
          date: today,
        })
      );
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