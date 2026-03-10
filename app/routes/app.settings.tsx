import { ActionFunctionArgs, LoaderFunctionArgs, useLoaderData } from "react-router";
import Index from "app/component/settings/Index";
import { authenticate } from "app/shopify.server";
import prisma from "app/db.server";
import { createNotification } from "app/notifications.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const setting = await prisma.reportSetting.findUnique({
    where: { shop }
  });

  return { setting };
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
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
  const { setting } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Store Locator">
      <Index setting={setting} />

      <s-stack alignItems="center" paddingBlock="large-200">
        <s-text>
          Learn more about <span style={{ color: 'blue' }}><s-link href="">Settings section</s-link></span>
        </s-text>
      </s-stack>
    </s-page>
  );
}
