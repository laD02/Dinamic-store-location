import prisma from "app/db.server";

/**
 * Lấy level thực tế của shop, có tính đến ngày hết hạn (expiresAt).
 * Nếu đã hết hạn, tự động cập nhật Database về gói basic.
 */
export async function getEffectiveLevel(shop: string): Promise<string> {
    const plan = await prisma.plan.findUnique({
        where: { shop },
    });

    if (!plan) return "basic";

    const now = new Date();
    // Kiểm tra nếu plan có ngày hết hạn và ngày đó đã trôi qua
    if (plan.expiresAt && plan.expiresAt < now) {
        // Gói đã hết hạn. Hạ cấp xuống basic trong DB để các lần check sau nhanh hơn
        if (plan.level !== "basic") {
            await prisma.plan.update({
                where: { shop },
                data: {
                    level: "basic",
                    expiresAt: null,
                },
            });
        }
        return "basic";
    }

    return plan.level;
}
