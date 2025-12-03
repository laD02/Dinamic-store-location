import { useState } from "react";
import { LoaderFunctionArgs, useLoaderData, useParams } from "react-router";

export async function loader({params}: LoaderFunctionArgs) {
    const {id} = params
    return id
}

export default function PlanDetail () {
    const id = useLoaderData()
    const [valuePay, setValuePay] = useState('credit')
    return (
        <s-page heading="Dynamic Store Locator">
            <s-stack direction="inline" justifyContent="space-between" alignItems="start">
                <s-stack gap="base" inlineSize="65%">
                    <s-stack direction="inline" justifyContent="start" background="base" padding="base" borderRadius="large" borderWidth="base" gap="base" alignItems="center">
                        <s-thumbnail alt="No image available" size="base" />
                        <s-box>
                            <s-heading >Dynamic Store Locator</s-heading>
                            <s-text color="subdued">by H1 Web Development</s-text>
                        </s-box>
                    </s-stack>
                    <s-stack background="subdued" borderRadius="large" borderWidth="base">
                        <s-box paddingInline="base" paddingBlockStart="base" background="base" borderRadius="large large none none">
                            <s-heading>New subscription: {id?.charAt(0).toUpperCase() + id?.slice(1)}</s-heading>
                        </s-box>
                        {
                            id === 'basic' && 
                                <s-box padding="base">
                                    <s-heading>Subscription details</s-heading>
                                    <s-text color="subdued">This plan is free. Replaces your previous paid subscription ($30.00 USD every 30 days) in the next billing cycle.</s-text>
                                </s-box>
                        }
                        {
                            id === 'advanced' &&
                                 <s-box padding="base">
                                    <s-heading>Subscription details</s-heading>
                                    <s-text color="subdued">$30.00 USD every 30 days. Replaces your previous subscription ($50.00 USD every 30 days).</s-text>
                                </s-box>
                        }
                    </s-stack>
                    {
                        id === 'advanced' &&
                            <s-stack background="base" padding="base" borderRadius="large" borderWidth="base" gap="base">
                                <s-heading>Payment method</s-heading>
                                <s-paragraph color="subdued">Choose how you’d like to pay for this charge.</s-paragraph>
                                <s-stack background="subdued" borderWidth="small" borderRadius="small" padding="base">
                                    <s-choice-list
                                        name="payment"
                                        onChange={(e) => {
                                            const value = e.currentTarget.values as any
                                            setValuePay(value)
                                        }}
                                    >
                                        <s-choice value="credit">Credit or debit card</s-choice>
                                        {
                                            valuePay === 'credit' &&
                                                <s-button>Add Credit Card</s-button>
                                        }
                                        <s-choice value="paypal">PayPal</s-choice>
                                    </s-choice-list>
                                </s-stack>
                            </s-stack>
                    }
                </s-stack>

                <s-stack background="base" borderRadius="large" inlineSize="33%" borderWidth="base">
                    <s-box padding="base" borderRadius="large large none none" >
                        <s-heading>Your next bill</s-heading>
                    </s-box>
                    {
                        id === 'basic' &&
                            <s-box padding="base" background="subdued">
                                <s-text color="subdued">This plan is free. You will not be billed.</s-text>
                            </s-box>
                    }
                    {
                        id === 'advanced' &&
                            <s-box padding="base" background="subdued" >
                                <s-stack direction="inline" justifyContent="space-between">
                                    <s-box>
                                        <s-heading>Subtotal</s-heading>
                                    </s-box>
                                    <s-box>
                                        <s-heading>$30.00</s-heading>
                                    </s-box>
                                </s-stack>
                                <s-paragraph color="subdued">plus any applicable taxes</s-paragraph>
                                <s-stack direction="inline" justifyContent="space-between">
                                    <s-box>
                                        <s-heading>Total</s-heading>
                                    </s-box>
                                    <s-box>
                                        <s-heading>$30.00</s-heading>
                                    </s-box>
                                </s-stack>
                                <s-paragraph color="subdued">Due Dec 2</s-paragraph>
                            </s-box>
                    }
                    <s-stack padding="small" inlineSize="100%">
                        <s-button variant="primary">Approve</s-button>
                    </s-stack>
                </s-stack>
            </s-stack>
            <s-stack paddingBlock="large-200">
                <s-divider />
            </s-stack>
            {
                id === 'basic' &&
                    <s-paragraph>By proceeding, you are agreeing to the <s-link href="https://www.shopify.com/legal/terms">Terms of Service</s-link>.</s-paragraph>
            }
            {
                id === 'advanced' &&
                    <s-paragraph>By proceeding, you are agreeing to the <s-link href="https://www.shopify.com/legal/terms">Terms of Service</s-link>. Subject to government tax and other prevailing charges.</s-paragraph>
            }
        </s-page>
    )
}