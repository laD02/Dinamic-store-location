import { ActionFunctionArgs, LoaderFunctionArgs, useLoaderData } from "react-router";
import BannerUpgrade from "app/component/BannerUpgrade";
import styles from "../css/intergration.module.css"
import { useState } from "react";
import GoogleMap from "app/component/googleMap";
import Faire from "app/component/faire";
import ShopifyB2B from "app/component/shopifyB2B";
import prisma from "app/db.server";
import { authenticate } from "app/shopify.server";
import { randomUUID } from "crypto";
import { getEffectiveLevel } from "../utils/plan.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop

  const level = await getEffectiveLevel(shop);
  // Remove redirect
  // if (level !== 'plus') {
  //   throw new Response(null, { status: 302, headers: { Location: "/app/plan" } });
  // }

  if (level !== 'plus') {
    return { exitkey: null, shopConnection: null, shopB2B: null, level };
  }

  const exitkey = await prisma.key.findFirst({
    where: { shop }
  })
  const shopConnection = await prisma.shopConnection.findFirst({
    where: { targetShop: shop }
  })
  const shopB2B = shopConnection?.sourceShop
    ? await prisma.key.findFirst({ where: { shop: shopConnection.sourceShop } })
    : null
  return { exitkey, shopConnection, shopB2B, level };
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop
  const formData = await request.formData()
  const actionType = formData.get('actionType') as string

  // Tạo key mới nếu chưa có
  if (actionType === 'generateKey') {
    const existing = await prisma.key.findFirst({ where: { shop } })
    if (existing?.b2bKey) {
      // Đã có key rồi, trả về luôn không tạo mới
      return { b2bKey: existing.b2bKey }
    }

    const newKey = randomUUID()
    if (existing) {
      await prisma.key.update({
        where: { id: existing.id },
        data: { b2bKey: newKey }
      })
    } else {
      await prisma.key.create({
        data: { shop, b2bKey: newKey }
      })
    }
    return { b2bKey: newKey }
  }

  if (actionType === 'disable') {
    await prisma.shopConnection.deleteMany({
      where: { targetShop: shop }
    })
    return { success: true }
  }

  if (actionType === 'save') {
    const save = formData.get('save') as string
    const saveField = JSON.parse(save) as { url: string, b2b: string }
    const displayUrl = saveField.url.replace('https://', '')

    // Check URL tồn tại trong DB
    const urlExists = await prisma.key.findFirst({
      where: { shop: displayUrl }
    })
    if (!urlExists) {
      return { errors: { url: 'This store URL does not exist or has not installed the app.' } }
    }

    // Check key hợp lệ
    const key = await prisma.key.findUnique({
      where: { b2bKey: saveField.b2b }
    })
    if (!key) {
      return { errors: { b2b: 'Invalid API key. Please check and try again.' } }
    }

    if (key.shop === shop) {
      return { errors: { b2b: 'You cannot connect to your own store.' } }
    }

    // Check nếu connection đã tồn tại thì update, chưa thì create
    const existingConnection = await prisma.shopConnection.findFirst({
      where: { targetShop: shop }
    })

    if (existingConnection) {
      await prisma.shopConnection.update({
        where: { id: existingConnection.id },
        data: {
          sourceShop: key.shop,
          sourceShopUrl: saveField.url
        }
      })
    } else {
      await prisma.shopConnection.create({
        data: {
          sourceShop: key.shop,
          targetShop: shop,
          sourceShopUrl: saveField.url
        }
      })
    }

    return { ok: true }
  }

  return {}
}

export default function Intergrations() {
  const { level } = useLoaderData<typeof loader>();
  const [number, setNumber] = useState<number>(0);
  const isPlus = level === 'plus';

  return (
    <s-page heading="Dynamic Store Locator">
      <s-stack direction="inline" alignItems="center" gap="small-400">
        <s-icon type="connect"></s-icon>
        <h2>Integrations</h2>
      </s-stack>
      {!isPlus && (
        <BannerUpgrade currentLevel={level} requiredLevel="plus" featureName="Integrations" />
      )}
      <div className={styles.wrapper} style={{ opacity: isPlus ? 1 : 0.5, pointerEvents: isPlus ? 'auto' : 'none' }}>
        <s-stack inlineSize="100%">
          {number === 0 && <ShopifyB2B />}
        </s-stack>
      </div>

      <s-stack alignItems="center" paddingBlock="large-200">
        <s-text>
          Learn more about <span style={{ color: 'blue' }}><s-link href="">Integrations section</s-link></span>
        </s-text>
      </s-stack>
    </s-page>
  );
}