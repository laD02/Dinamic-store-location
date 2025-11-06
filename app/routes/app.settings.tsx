// app/routes/app.help-center.tsx

import { LoaderFunctionArgs } from "react-router";


export async function loader({ request }: LoaderFunctionArgs) {
  return null; // hoặc return {}
}

export default function Settings() {
  return (
    <s-page heading="Dynamic Store Locator">

    </s-page>
  );
}
