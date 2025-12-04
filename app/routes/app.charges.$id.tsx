import { useAppBridge } from "@shopify/app-bridge-react";
import prisma from "app/db.server";
import { useEffect, useState } from "react";
import { ActionFunctionArgs, LoaderFunctionArgs, redirect, useFetcher, useLoaderData, useNavigate} from "react-router";

export async function loader({params}: LoaderFunctionArgs) {
    const {id} = params
    return id
}

export async function action({request}: ActionFunctionArgs) {
    const formData = await request.formData()
    const actionType = formData.get('actionType')

    if (actionType === 'addLevel') {
        const exitting = await prisma.plan.findFirst()
        if (exitting) {
            await prisma.plan.update({
                where: {id: exitting.id},
                data: {
                    level: formData.get("id") as string
                }
            })
        } else {
            await prisma.plan.create({
                data:{
                    level: formData.get("id") as string
                }
            })
        }
        return {ok: true}
    }

    return {success: true}
}

export default function PlanDetail () {
    const id = useLoaderData()
    const fetcher = useFetcher()
    const [valuePay, setValuePay] = useState<string[]>(['credit'])
    const shopify = useAppBridge()
    const navigate = useNavigate()

    const handleSubmit = () => {
        const formData = new FormData()
        formData.append('actionType', 'addLevel')
        formData.append('id', id)
        fetcher.submit(formData, {method: 'post'})
    }

    useEffect(() => {
        if (fetcher.data?.ok) {
          shopify.toast.show('Successfully!');
          navigate('/app/plan')
        }
      }, [fetcher.data]);
    return (
        <s-page heading="Dynamic Store Locator">
            <s-stack direction="inline" justifyContent="space-between" alignItems="start" paddingBlockStart="large-100">
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
                        {
                            id === 'plus' &&
                                 <s-box padding="base">
                                    <s-heading>Subscription details</s-heading>
                                    <s-text color="subdued">$50.00 USD every 30 days. Replaces your previous subscription ($30.00 USD every 30 days).</s-text>
                                </s-box>
                        }
                    </s-stack>
                    {
                        (id === 'advanced' || id === 'plus') &&
                            <s-stack background="base" padding="base" borderRadius="large" borderWidth="base" gap="base">
                                <s-heading>Payment method</s-heading>
                                <s-paragraph color="subdued">Choose how you’d like to pay for this charge.</s-paragraph>
                                <s-stack background="subdued" borderWidth="small" borderRadius="small" padding="base">
                                    <s-choice-list
                                        name="payment"
                                        values={valuePay}
                                        onChange={(e) => {
                                            const value = e.currentTarget.values as any
                                            setValuePay(value)
                                        }}
                                    >
                                        <s-choice value="credit"> Credit or debit card</s-choice>
                                        <s-choice value="paypal">PayPal</s-choice>
                                    </s-choice-list>
                                    {
                                        valuePay.includes('credit') &&
                                            <s-box paddingBlockStart="base">
                                                <s-button>Add Credit Card</s-button>
                                            </s-box>
                                    }
                                    {
                                        valuePay.includes('paypal') &&
                                            <s-box paddingBlockStart="base">
                                                <s-button>Pay by Paypal</s-button>
                                            </s-box>
                                    }
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
                    {
                        id === 'plus' &&
                            <s-box padding="base" background="subdued" >
                                <s-stack direction="inline" justifyContent="space-between">
                                    <s-box>
                                        <s-heading>Subtotal</s-heading>
                                    </s-box>
                                    <s-box>
                                        <s-heading>$50.00</s-heading>
                                    </s-box>
                                </s-stack>
                                <s-paragraph color="subdued">plus any applicable taxes</s-paragraph>
                                <s-stack direction="inline" justifyContent="space-between">
                                    <s-box>
                                        <s-heading>Total</s-heading>
                                    </s-box>
                                    <s-box>
                                        <s-heading>$50.00</s-heading>
                                    </s-box>
                                </s-stack>
                                <s-paragraph color="subdued">Due Dec 2</s-paragraph>
                            </s-box>
                    }
                    <s-stack padding="small" inlineSize="100%">
                        <s-button variant="primary" onClick={() => handleSubmit()}>Approve</s-button>
                    </s-stack>
                </s-stack>
            </s-stack>
            <s-stack paddingBlock="large-200">
                <s-divider />
            </s-stack>
            <s-stack paddingBlockEnd="large-100">
                {
                    id === 'basic' &&
                        <s-paragraph>By proceeding, you are agreeing to the <s-link href="https://www.shopify.com/legal/terms">Terms of Service</s-link>.</s-paragraph>
                }
                {
                    (id === 'advanced' || id === 'plus') &&
                        <s-paragraph>By proceeding, you are agreeing to the <s-link href="https://www.shopify.com/legal/terms">Terms of Service</s-link>. Subject to government tax and other prevailing charges.</s-paragraph>
                }
            </s-stack>
        </s-page>
    )
}