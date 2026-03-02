import Index from "app/component/analytics/Index";
import { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
    return {

    }
}

export async function action({ request }: ActionFunctionArgs) {
    return {

    }
}

export default function Analytics() {
    return (
        <s-page heading="Store Locator">
            <Index />

            <s-stack alignItems="center" paddingBlock="large-200">
                <s-text>
                    Learn more about <span style={{ color: 'blue' }}><s-link href="">Analytics section</s-link></span>
                </s-text>
            </s-stack>
        </s-page>
    );
}