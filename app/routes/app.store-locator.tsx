import prisma from "app/db.server";
import { authenticate } from "../shopify.server";
import { LoaderFunctionArgs } from "react-router";

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