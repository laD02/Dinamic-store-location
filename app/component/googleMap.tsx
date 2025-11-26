import { useAppBridge } from "@shopify/app-bridge-react"
import { useEffect, useState } from "react"
import { useFetcher, useLoaderData } from "react-router"

export default function GoogleMap () {
    const {key} = useLoaderData()
    const fetcher = useFetcher()
    const [value, setValue] = useState(key ||'')
    const [show, setShow] = useState(false)
    const shopify = useAppBridge()

    useEffect(() => {
        if (fetcher.data?.ok) {
        shopify.toast.show('The settings have been updated.')
        }
    }, [fetcher.data, shopify]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setValue(value)

        if (value.trim()) {
            setShow(false)
        }
    }

    const handleSubmit = () => {
        if (!value || value.trim() === '') {
            setShow(true)
            return
        }
        const formData = new FormData()
        formData.append("ggKey", value)
        formData.append('actionType', 'saveGGKey')
        fetcher.submit(formData, {method: 'post'})
    }

    return (
        <s-stack inlineSize="100%" gap="large">
            <s-stack background="base" padding="base" borderRadius="large" inlineSize="100%" gap="small" borderWidth="base">
                <h2>Google Maps</h2>
                {
                    show && 
                    <s-banner heading="There was an issue saving your API key" tone="info" ></s-banner>
                }       
                <s-stack>
                    <h3>API Key Connection</h3>
                    <s-paragraph>In order to use Google Maps on your site you must sign up for an API Key with Google. <s-link href="https://cloud.google.com/?hl=en">Click here</s-link> to get an API key and paste it below when you have created one.</s-paragraph>
                </s-stack>
                <s-text-field 
                    placeholder="Enter an API key for your map"
                    name="ggKey"
                    value={key.ggKey}
                    onInput={(e: any) => handleChange(e)}
                />
                <s-stack direction="inline" justifyContent="end" paddingBlockStart="small" paddingInline="small-200">
                    <s-button onClick={() => handleSubmit()}>
                        save
                    </s-button>
                </s-stack>
            </s-stack>
            
            <s-banner heading="Need Help Setting up your API Key?">
                We created a step-by-step guide to walk you through setting up a Google Maps API Key. <s-link href="https://www.h1-apps.com/articles/how-to-setup-a-google-maps-api-key">Click here</s-link> to access that guide.
            </s-banner>
        </s-stack>
    )
}