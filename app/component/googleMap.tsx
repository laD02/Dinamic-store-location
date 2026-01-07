import { SaveBar, useAppBridge } from "@shopify/app-bridge-react"
import { useEffect, useState } from "react"
import { useFetcher, useLoaderData } from "react-router"

export default function GoogleMap() {
    const { key } = useLoaderData()
    const fetcher = useFetcher()
    const [value, setValue] = useState('')
    const [show, setShow] = useState(false)
    const shopify = useAppBridge()
    const [number, setNumber] = useState<number>(0)
    const isSaving = fetcher.state === "submitting" || fetcher.state === "loading";
    const originalValue = key?.ggKey ?? ""

    useEffect(() => {
        if (fetcher.data?.ok) {
            shopify.toast.show('The settings have been updated.')
            shopify.saveBar.hide("my-save-bar");
        }
    }, [fetcher.data, shopify]);

    useEffect(() => {
        setValue(key?.ggKey ?? "")
    }, [key])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setValue(newValue)

        if (newValue !== originalValue) {
            shopify.saveBar.show("my-save-bar")
        } else {
            shopify.saveBar.hide("my-save-bar")
        }

        if (newValue.trim()) setShow(false)
    }

    const handleSubmit = () => {
        if (!value || value.trim() === '') {
            setShow(true)
            return
        }
        const formData = new FormData()
        formData.append("ggKey", value)
        formData.append('actionType', 'saveGGKey')
        fetcher.submit(formData, { method: 'post' })
        setValue('')
    }

    return (
        <s-page heading="Dynamic Store Locator">
            <SaveBar id="my-save-bar">
                <button variant="primary" onClick={handleSubmit} loading={isSaving ? "true" : undefined}></button>
                <button disabled={isSaving} onClick={() => {
                    setValue(key.ggKey)
                    shopify.saveBar.hide("my-save-bar");
                }}
                >
                </button>
            </SaveBar>
            {/* <div className={styles.wrapper}> */}
            <s-query-container>
                <s-grid
                    gridTemplateColumns="@container (inline-size > 768px) 1fr 2fr, 1fr"
                    gap="base"
                >
                    <s-grid-item>
                        <s-section >
                            <s-stack gap="small" >
                                <s-text type="strong">Map Providers</s-text >
                                <s-clickable
                                    borderRadius="base"
                                    background={number === 0 ? 'subdued' : 'base'}
                                    onClick={() => setNumber(0)}
                                >
                                    <s-stack direction="inline" alignItems="center" gap="small" padding="small-200">
                                        <s-box>
                                            <s-icon type="location" />
                                        </s-box>
                                        <s-box>
                                            <s-text>Googles Map</s-text>
                                        </s-box>
                                    </s-stack>
                                </s-clickable>
                                {/* <s-divider/>
                                <s-text type="strong">Connected Integrations</s-text >
                                <div className={`${styles.googleMap} ${number === 1 && styles.active}`} onClick={() => setNumber(1)}>
                                    <i className="fa-solid fa-gear"></i>
                                    <span>Faire</span>
                                </div>
                                <div className={`${styles.googleMap} ${number === 2 && styles.active}`} onClick={() => setNumber(2)}>
                                    <i className="fa-solid fa-gear"></i>
                                    <span>Shopify B2B</span>
                                </div> */}
                            </s-stack>
                        </s-section>
                    </s-grid-item>

                    <s-grid-item>
                        <s-stack>
                            {/* <fetcher.Form   
                                    data-save-bar
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        handleSubmit()
                                    }}
                                    onReset={() => setValue(key.ggKey)}
                                > */}
                            <s-stack inlineSize="100%" gap="large">
                                <s-section>
                                    <s-stack inlineSize="100%" gap="small">
                                        <h2>Google Maps</h2>
                                        <s-stack>
                                            <h3>API Key Connection</h3>
                                            <s-paragraph>In order to use Google Maps on your site you must sign up for an API Key with Google. <s-link href="https://cloud.google.com/?hl=en">Click here</s-link> to get an API key and paste it below when you have created one.</s-paragraph>
                                        </s-stack>
                                        <s-text-field
                                            placeholder="Enter an API key for your map"
                                            name="ggKey"
                                            value={value}
                                            onInput={(e: any) => handleChange(e)}
                                            error={show ? "API Key cannot be empty" : ""}
                                        />
                                    </s-stack>
                                </s-section>

                                <s-banner heading="Need Help Setting up your API Key?">
                                    We created a step-by-step guide to walk you through setting up a Google Maps API Key. <s-link href="">Click here</s-link> to access that guide.
                                </s-banner>
                            </s-stack>
                            {/* </fetcher.Form> */}
                        </s-stack>
                    </s-grid-item>
                </s-grid>
            </s-query-container>
            {/* <s-stack background="base" padding="base" borderRadius="large" inlineSize="45%" gap="small" borderWidth="base">
                        <s-text type="strong">Map Providers</s-text >
                        <div className={`${styles.googleMap} ${number === 0 && styles.active}`} onClick={() => setNumber(0)}>
                            <i className="fa-solid fa-location-dot"></i>
                            <span>Googles Map</span>
                        </div> */}
            {/* <s-divider/>
                    <s-text type="strong">Connected Integrations</s-text >
                    <div className={`${styles.googleMap} ${number === 1 && styles.active}`} onClick={() => setNumber(1)}>
                        <i className="fa-solid fa-gear"></i>
                        <span>Faire</span>
                    </div>
                    <div className={`${styles.googleMap} ${number === 2 && styles.active}`} onClick={() => setNumber(2)}>
                        <i className="fa-solid fa-gear"></i>
                        <span>Shopify B2B</span>
                    </div> */}
            {/* </s-stack>
                    <s-stack inlineSize="100%">
                        <Form   
                            data-save-bar
                            onSubmit={(e) => {
                                e.preventDefault()
                                handleSubmit()
                            }}
                            onReset={() => setValue(key.ggKey)}
                        >
                            <s-stack inlineSize="100%" gap="large">
                                <s-stack background="base" padding="base" borderRadius="large" inlineSize="100%" gap="small" borderWidth="base">
                                    <h2>Google Maps</h2>
                                    <s-stack>
                                        <h3>API Key Connection</h3>
                                        <s-paragraph>In order to use Google Maps on your site you must sign up for an API Key with Google. <s-link href="https://cloud.google.com/?hl=en">Click here</s-link> to get an API key and paste it below when you have created one.</s-paragraph>
                                    </s-stack>
                                    <s-text-field 
                                        placeholder="Enter an API key for your map"
                                        name="ggKey"
                                        // value={value}
                                        onInput={(e: any) => handleChange(e)}
                                        error={show ? "API Key cannot be empty" :"" }
                                    />
                                </s-stack>
                                
                                <s-banner heading="Need Help Setting up your API Key?">
                                    We created a step-by-step guide to walk you through setting up a Google Maps API Key. <s-link href="https://www.h1-apps.com/articles/how-to-setup-a-google-maps-api-key">Click here</s-link> to access that guide.
                                </s-banner>
                            </s-stack>
                        </Form>
                    </s-stack> */}
            {/* </div> */}
        </s-page>
    )
}