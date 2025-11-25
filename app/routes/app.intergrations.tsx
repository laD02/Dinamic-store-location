// app/routes/app.help-center.tsx

import { LoaderFunctionArgs } from "react-router";
import styles from "../css/intergration.module.css"
import { useState } from "react";
import GoogleMap from "app/component/googleMap";
import Faire from "app/component/faire";
import ShopifyB2B from "app/component/shopifyB2B";


export async function loader({ request }: LoaderFunctionArgs) {
  return null; // hoặc return {}
}

export default function Intergrations() {
  const [number, setNumber] = useState<number>(0)

  return (
    <s-page heading="Dynamic Store Locator">
      <h2>Integrations</h2>
      <div className={styles.wrapper}>
        <s-stack background="base" padding="base" borderRadius="large" inlineSize="45%" gap="small" borderWidth="base">
          <s-text type="strong">Map Providers</s-text >
          <div className={`${styles.googleMap} ${number === 0 && styles.active}`} onClick={() => setNumber(0)}>
            <i className="fa-solid fa-location-dot"></i>
            <span>Googles Map</span>
          </div>
          <s-divider/>
          <s-text type="strong">Connected Integrations</s-text >
          <div className={`${styles.googleMap} ${number === 1 && styles.active}`} onClick={() => setNumber(1)}>
            <i className="fa-solid fa-gear"></i>
            <span>Faire</span>
          </div>
          <div className={`${styles.googleMap} ${number === 2 && styles.active}`} onClick={() => setNumber(2)}>
            <i className="fa-solid fa-gear"></i>
            <span>Shopify B2B</span>
          </div>
        </s-stack>
        <s-stack inlineSize="100%">
          {number === 0 && <GoogleMap />}
          {number === 1 && <Faire />}
          {number === 2 && <ShopifyB2B />}
        </s-stack>
      </div>
    </s-page>
  );
}
