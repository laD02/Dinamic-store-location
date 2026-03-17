import { ActionFunctionArgs, LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";
import Index from "app/component/settings/Index";
import { authenticate } from "app/shopify.server";
import prisma from "app/db.server";
import { createNotification } from "app/notifications.server";
import { getEffectiveLevel } from "../utils/plan.server";
import BannerUpgrade from "app/component/BannerUpgrade";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const level = await getEffectiveLevel(session.shop);
  const isPlus = level === 'plus';

  if (!isPlus) {
    return { setting: null, isPlus, level };
  }

  const setting = await prisma.reportSetting.findUnique({
    where: { shop }
  });

  return { setting, isPlus, level };
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const level = await getEffectiveLevel(session.shop);
  if (level !== 'plus') {
    return { ok: false, message: "Only available on Business Plus plan" };
  }
  const formData = await request.formData();

  // Handle test notification action
  if (formData.get("_action") === "test") {
    const setting = await prisma.reportSetting.findUnique({ where: { shop } });
    let sent = 0;
    if (setting?.inAppDaily) {
      await createNotification(shop, "Daily Analytics Report", "Your daily analytics report is ready to view.", "info");
      sent++;
    }
    if (setting?.inAppWeekly) {
      await createNotification(shop, "Weekly Analytics Report", "Your weekly analytics report is ready to view.", "info");
      sent++;
    }
    if (setting?.inAppMonthly) {
      await createNotification(shop, "Monthly Analytics Report", "Your monthly analytics report is ready to view.", "info");
      sent++;
    }
    if (sent === 0) {
      return { ok: false, test: true, message: "No notifications enabled. Please enable at least one." };
    }
    return { ok: true, test: true, sent };
  }

  const dayOfWeek = formData.get("dayOfWeek")?.toString() || "Monday";
  const dayOfMonth = parseInt(formData.get("dayOfMonth")?.toString() || "1", 10);
  const dailyTime = formData.get("dailyTime")?.toString() || "09:00";
  const weeklyTime = formData.get("weeklyTime")?.toString() || "09:00";
  const monthlyTime = formData.get("monthlyTime")?.toString() || "09:00";

  const inAppDaily = formData.get("inAppDaily") === "true";
  const inAppWeekly = formData.get("inAppWeekly") === "true";
  const inAppMonthly = formData.get("inAppMonthly") === "true";

  await prisma.reportSetting.upsert({
    where: { shop },
    update: {
      dayOfWeek,
      dayOfMonth,
      dailyTime,
      weeklyTime,
      monthlyTime,
      inAppDaily,
      inAppWeekly,
      inAppMonthly
    },
    create: {
      shop,
      dayOfWeek,
      dayOfMonth,
      dailyTime,
      weeklyTime,
      monthlyTime,
      inAppDaily,
      inAppWeekly,
      inAppMonthly
    }
  });

  return { ok: true };
}

export default function Settings() {
  const { setting, isPlus, level } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <s-page heading="Store Locator">
      <s-stack direction="inline" justifyContent="space-between" alignItems="center" gap="small-400">
        <s-stack direction="inline" alignItems="center" gap="small-400">
          <s-icon type="settings"></s-icon>
          <h2>Settings</h2>
        </s-stack>
      </s-stack>

      {!isPlus && (
        <BannerUpgrade currentLevel={level} requiredLevel="plus" featureName="Settings and Notifications" />
      )}
      <div style={{ opacity: isPlus ? 1 : 0.5, pointerEvents: isPlus ? 'auto' : 'none' }}>
        <Index setting={setting} />
      </div>

      <s-stack alignItems="center" paddingBlock="large-200">
        <s-text>
          Learn more about <span style={{ color: 'blue' }}><s-link href="">Settings section</s-link></span>
        </s-text>
      </s-stack>
    </s-page>
  );
}
