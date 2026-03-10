import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    await db.session.deleteMany({ where: { shop } });
    await db.plan.deleteMany({ where: { shop } });
    await db.style.deleteMany({ where: { shop } });
    await db.reportSetting.deleteMany({ where: { shop } });
    // Keep events for analytics but delete the main store? 
    // Usually we want to keep some data for 48 hours for GDPR but Shopify expects a clean session.
  }

  return new Response();
};
