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
                    <s-paragraph>This app requires a Google Maps API key to function properly. Once you have your API key, please enter it in the Google Maps section under the Integrations tab. For help setting up an API key, refer to the help article below.</s-paragraph>
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
                    <s-paragraph>If you have a list of retailers that you would like to upload manually, download the CSV template by clicking the button below. After filling in the required fields, go to the All Locations tab, click Bulk Upload, and upload your completed file from there.</s-paragraph>
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