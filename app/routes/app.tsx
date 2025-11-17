import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useNavigation, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "20d7d45fc96ed3baec84f8232a6cf110" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
   const navigation = useNavigation();

  const isLoading =
    navigation.state === "loading" ||
    navigation.state === "submitting";

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">All Location</s-link>
        <s-link href="/app/map-designers">Map Designers</s-link>
        <s-link href="/app/intergrations">Intergrations</s-link>
        <s-link href="/app/settings">Settings</s-link>
        <s-link href="/app/help-center">Help Center</s-link>
      </s-app-nav>
      {isLoading ? (
        <div  style={{display: "flex", alignItems:"center", justifyContent:'center', height:"100vh", width:"100vw"}}>
          <s-spinner size="large" accessibilityLabel=""/>
          <s-text></s-text>
        </div>
      ) : (
        <Outlet />
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
