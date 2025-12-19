import { downloadCSVTemplate } from "app/utils/exportTemplateCSV"
import { useNavigate } from "react-router"

export default function GoogleApi () {
    const navigate = useNavigate()

    const handleExport = () => {
        downloadCSVTemplate()
    }
    return (
       <s-stack padding="base" gap="base">
            <s-stack direction="inline" justifyContent="start" alignItems="start" gap="small">
                <s-stack>
                    <s-icon type="circle-dashed"/>
                </s-stack>
                <s-stack gap="small" inlineSize="92%">
                    <s-text type="strong">Google Maps</s-text>
                    <s-paragraph>This app requires a Google Maps API Key in order to work correctly. Once you have your API Key, paste it in the Google Maps section on the Integrations Tab. If you need assistance setting up an API click, click the help article below.</s-paragraph>
                    <s-link href="/app/settings?tab=googleMap">
                        <s-button>Input API Key</s-button>
                    </s-link>
                </s-stack>
            </s-stack>

            <s-stack direction="inline" justifyContent="start" alignItems="start" gap="small">
                <s-stack>
                    <s-icon type="circle-dashed"/>
                </s-stack>
                <s-stack gap="small" inlineSize="92%">
                    <s-text type="strong">Manual Upload</s-text>
                    <s-paragraph>This app requires a Google Maps API Key in order to work correctly. Once you have your API Key, paste it in the Google Maps section on the Integrations Tab. If you need assistance setting up an API click, click the help article below.</s-paragraph>
                    <s-stack direction="inline" justifyContent="start" gap="base">
                        <s-button onClick={() => handleExport()}>Bulk Upload Template</s-button>
                        <s-link href="/app/allLocation">
                            <s-button>All Locations</s-button>
                        </s-link>
                    </s-stack>
                </s-stack>
            </s-stack>
       </s-stack>
    )
}