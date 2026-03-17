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

/**
 * Đồng bộ hóa thông tin gói cước từ Shopify GraphQL API vào Database.
 * Thường dùng khi người dùng truy cập app lần đầu hoặc cài đặt lại.
 */
export async function syncPlanWithShopify(admin: any, shop: string) {
    const response = await admin.graphql(
        `#graphql
        query {
            appInstallation {
                activeSubscriptions {
                    id
                    name
                    status
                    currentPeriodEnd
                    trialDays
                }
            }
        }`
    );

    const json = await response.json();
    const subscriptions = json.data?.appInstallation?.activeSubscriptions || [];

    let actualLevel = 'basic';
    let expiresAt: Date | null = null;

    const activeSub = subscriptions.find((sub: any) => sub.status === 'ACTIVE');
    const existingPlan = await prisma.plan.findUnique({ where: { shop } });

    if (activeSub) {
        actualLevel = activeSub.name.toLowerCase();
        // Nếu là trial, chúng ta lưu ngày hết hạn của kỳ hiện tại
        if (activeSub.trialDays > 0) {
            expiresAt = new Date(activeSub.currentPeriodEnd);
        } else {
            expiresAt = null; // Gói trả phí định kỳ, không để ngày hết hạn để getEffectiveLevel không hạ cấp nhầm
        }
    } else {
        // Nếu không có sub ACTIVE, kiểm tra xem DB hiện tại có còn trong grace period không
        if (existingPlan && existingPlan.expiresAt && new Date(existingPlan.expiresAt) > new Date()) {
            actualLevel = existingPlan.level;
            expiresAt = new Date(existingPlan.expiresAt);
        } else {
            actualLevel = 'basic';
            expiresAt = null;
        }
    }

    const newExpiresAt = expiresAt ? expiresAt.toISOString() : null;
    const oldExpiresAt = existingPlan?.expiresAt ? existingPlan.expiresAt.toISOString() : null;

    if (!existingPlan || existingPlan.level !== actualLevel || oldExpiresAt !== newExpiresAt) {
        await prisma.plan.upsert({
            where: { shop },
            update: { level: actualLevel, expiresAt: expiresAt },
            create: { shop, level: actualLevel, expiresAt: expiresAt },
        });
    }

    return actualLevel;
}
