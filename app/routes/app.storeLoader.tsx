import prisma from "app/db.server";
import { authenticate } from "../shopify.server"
import { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  let shop: string | undefined;

  try {
    const { session } = await authenticate.admin(request)
    shop = session?.shop
  } catch {
    // Theme Editor không có session → lấy từ URL
    const url = new URL(request.url)
    shop = url.searchParams.get("shop") ?? undefined
  }

  // Optional: Return early if no shop found
  if (!shop) {
    return new Response(JSON.stringify({ stores: [], style: null }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }

  const stores = await prisma.store.findMany({
    where: {
      shop,
      visibility: 'visible'
    },
    orderBy: {
      createdAt: 'desc', // mới nhất lên đầu
    },
  });

  const style = await prisma.style.findFirst({
    where: { shop }
  })

  return new Response(JSON.stringify({ stores, style }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
  });
}