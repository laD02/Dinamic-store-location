import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useNavigation, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { createApp } from '@shopify/app-bridge';
import { authenticate } from "../shopify.server";
import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "20d7d45fc96ed3baec84f8232a6cf110" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const shopify = useAppBridge();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Khi loader trả dữ liệu, tắt initial loading
  useEffect(() => {
    if (apiKey) {
      setIsInitialLoading(false);
    }
  }, [apiKey]);

  const isLoading =
    isInitialLoading || navigation.state === "loading" || navigation.state === "submitting";

  useEffect(() => {
    if (!shopify) return;
    shopify.loading(isLoading);
  }, [isLoading, shopify]);

  useEffect(() => {
    if (typeof window === "undefined") return; // Avoid SSR crash

    const url = new URL(window.location.href);
    const host = url.searchParams.get("host");
    if (!host || !apiKey) {
      console.warn("Missing host param, Shopify may force redirect.");
      return;
    }
    createApp({
      apiKey,
      host,
      forceRedirect: true,
    });

  }, [apiKey]); // Only re-init when apiKey changes

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app/allLocation">All Location</s-link>
        <s-link href="/app/map-designers">Map Designers</s-link>
        {/* <s-link href="/app/settings">Settings</s-link> */}
      </s-app-nav>

      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: 'center', height: "100vh", width: "100vw" }}>
          <s-spinner size="large" accessibilityLabel="" />
        </div>
      ) : (
        <>
          <Outlet />
        </>
      )}
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
