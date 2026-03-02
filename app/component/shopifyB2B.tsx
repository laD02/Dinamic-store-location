import { useFetcher, useLoaderData } from "react-router"
import { useEffect, useRef, useState } from "react"
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react"

export default function ShopifyB2B() {
    const { exitkey, shopConnection, shopB2B } = useLoaderData()
    const fetcher = useFetcher()
    const keyFetcher = useFetcher()
    const shopify = useAppBridge()
    const [url, setUrl] = useState<string | null>(null)
    const [b2b, setB2B] = useState<string | null>(null)
    const [errorB2B, setErrorB2B] = useState('')
    const [errorUrl, setErrorUrl] = useState('')
    const [showKey, setShowKey] = useState(false)
    const isSaving = fetcher.state === "submitting" || fetcher.state === "loading"

    // Dirty check refs
    const initialUrlRef = useRef<string>('')
    const initialB2BRef = useRef<string>('')
    const isDiscardingRef = useRef(false)
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
    const [isInitialized, setIsInitialized] = useState(false)

    // Initialize refs
    useEffect(() => {
        initialUrlRef.current = shopConnection?.sourceShopUrl ?? ''
        initialB2BRef.current = shopB2B?.b2bKey ?? ''
        setIsInitialized(true)
    }, [])

    // Tự động tạo key nếu chưa có
    useEffect(() => {
        if (!exitkey?.b2bKey) {
            const formData = new FormData()
            formData.append('actionType', 'generateKey')
            keyFetcher.submit(formData, { method: 'post' })
        }
    }, [])

    const checkDirty = () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = setTimeout(() => {
            if (isDiscardingRef.current || !isInitialized) return

            // null = chưa chạm → dùng giá trị loader
            // '' = đã xóa trắng → tính là thay đổi
            const currentUrl = url !== null ? url : (shopConnection?.sourceShopUrl ?? '')
            const currentB2B = b2b !== null ? b2b : (shopB2B?.b2bKey ?? '')

            const dirty =
                currentUrl !== initialUrlRef.current ||
                currentB2B !== initialB2BRef.current

            if (dirty) {
                shopify.saveBar.show("b2b-save-bar")
            } else {
                shopify.saveBar.hide("b2b-save-bar")
            }
        }, 150)
    }

    useEffect(() => {
        if (!isInitialized) return
        checkDirty()
    }, [url, b2b, isInitialized])

    useEffect(() => {
        if (fetcher.data?.ok) {
            shopify.toast.show("The settings have been updated.")
            initialUrlRef.current = url !== null ? url : (shopConnection?.sourceShopUrl ?? '')
            initialB2BRef.current = b2b !== null ? b2b : (shopB2B?.b2bKey ?? '')
            setErrorB2B('')
            setErrorUrl('')
            shopify.saveBar.hide("b2b-save-bar")
        }

        // Khi disable thành công
        if (fetcher.data?.success) {
            shopify.toast.show("Shopify B2B access has been revoked successfully.")
            setUrl('')        // reset về rỗng
            setB2B('')
            initialUrlRef.current = ''   // cập nhật initial để không bị dirty
            initialB2BRef.current = ''
            setErrorUrl('')
            setErrorB2B('')
            shopify.saveBar.hide("b2b-save-bar")
        }

        if (fetcher.data?.errors?.url) setErrorUrl(fetcher.data.errors.url)
        if (fetcher.data?.errors?.b2b) setErrorB2B(fetcher.data.errors.b2b)
    }, [fetcher.data])

    const displayKey = showKey
        ? (keyFetcher.data?.b2bKey ?? exitkey?.b2bKey ?? '')
        : ''

    const handleChangeUrl = (e: any) => {
        setUrl(e.target.value)   // '' khi xóa trắng, khác null
        setErrorUrl('')
    }

    const handleChangeB2B = (e: any) => {
        setB2B(e.target.value)
        setErrorB2B('')
    }

    const handleDisable = () => {
        const formData = new FormData()
        formData.append('actionType', 'disable')
        fetcher.submit(formData, { method: 'post' })
    }

    const handleSubmit = () => {
        const regex = /^https:\/\/[a-z0-9-]+\.myshopify\.com$/i
        let hasError = false

        // handleSubmit
        const currentUrl = url !== null ? url : (shopConnection?.sourceShopUrl ?? '')
        const currentB2B = b2b !== null ? b2b : (shopB2B?.b2bKey ?? '')

        if (!regex.test(currentUrl)) {
            setErrorUrl('Please enter the Shopify B2B store URL. It should be in the format: https://store.myshopify.com')
            hasError = true
        }
        if (currentB2B.trim() === '') {
            setErrorB2B('Please enter the Shopify B2B API key.')
            hasError = true
        }
        if (hasError) return

        const formData = new FormData()
        formData.append('save', JSON.stringify({ url: currentUrl, b2b: currentB2B }))
        formData.append('actionType', 'save')
        fetcher.submit(formData, { method: 'post' })
    }

    const handleDiscard = () => {
        isDiscardingRef.current = true

        setUrl(null)
        setB2B(null)
        setErrorUrl('')
        setErrorB2B('')

        requestAnimationFrame(() => {
            shopify.saveBar.hide("b2b-save-bar")
            isDiscardingRef.current = false
        })
    }

    return (
        <>
            <SaveBar id="b2b-save-bar">
                <button
                    variant="primary"
                    onClick={handleSubmit}
                    loading={isSaving ? "true" : undefined}
                >
                    Save
                </button>
                <button onClick={handleDiscard} disabled={isSaving}>
                    Discard
                </button>
            </SaveBar>

            <s-stack inlineSize="100%" gap="large">
                <s-stack background="base" padding="base" borderRadius="large" inlineSize="100%" gap="small" borderWidth="base">
                    <s-stack direction="inline" justifyContent="space-between" alignItems="center" gap="base">
                        <s-stack direction="inline" alignItems="center" gap="small">
                            <h2>Shopify B2B</h2>
                            {
                                shopConnection && (
                                    <s-badge tone="success">
                                        <s-stack direction="inline" alignItems="center" gap="small-400">
                                            <s-icon type="enabled" />
                                            Enabled
                                        </s-stack>
                                    </s-badge>
                                )
                            }
                        </s-stack>
                        {
                            shopConnection && (
                                <s-button onClick={handleDisable}>Disable</s-button>
                            )
                        }
                    </s-stack>
                    <s-paragraph>Automatically display and update information for your Shopify B2B customers on your map. You must have a Shopify Plus account with active Company listings in order for this integration to work correctly.</s-paragraph>

                    <s-heading>Shopify B2B Account</s-heading>
                    <s-stack gap="small">
                        <s-url-field
                            label="Shopify B2B Store URL"
                            placeholder="https://your-store.myshopify.com"
                            details="URL must be in the format: https://store.myshopify.com"
                            onInput={(e: any) => handleChangeUrl(e)}
                            error={errorUrl}
                            value={url !== null ? url : (shopConnection?.sourceShopUrl ?? '')}
                        />
                        <s-password-field
                            label="Shopify B2B API Key"
                            placeholder="Enter Shopify B2B API Key"
                            onInput={(e: any) => handleChangeB2B(e)}
                            error={errorB2B}
                            value={b2b !== null ? b2b : (shopB2B?.b2bKey ?? '')}
                        />
                        <s-banner
                            heading="In order to pull in your B2B customer information from another Shopify store you own into the Retail Locator on this store, you must load the app to your other store. Download the Dynamic Store locator app to your wholesale store, then go to the Shopify B2B section in the Integrations tab. In the blue box, click to display the store's unique API key. Copy that key over into the field above."
                            tone="warning"
                            dismissible
                        />
                    </s-stack>
                </s-stack>

                <s-banner heading="If you just loaded the app in order to connect this store with your Retail Locator, please see instructions below.">
                    <s-grid gap="small">
                        <s-text>
                            <s-link onClick={() => setShowKey(true)}><s-heading>Click here</s-heading></s-link> to display your individualized API key below, then copy it over into your other store.
                        </s-text>
                        <s-heading>Connect Your B2B Store With Another Store</s-heading>
                        <s-text-field
                            label="API Key"
                            placeholder={
                                !showKey
                                    ? 'No access token available'
                                    : keyFetcher.state === 'submitting'
                                        ? 'Generating key...'
                                        : 'No access token available'
                            }
                            value={displayKey}
                            readOnly
                        />
                    </s-grid>
                </s-banner>
            </s-stack>
        </>
    )
}