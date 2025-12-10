import prisma from "app/db.server";

export async function loader() {
  const stores = await prisma.store.findMany();
  const style = await prisma.style.findFirst()

  return new Response(JSON.stringify({ stores, style }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
  });
}

