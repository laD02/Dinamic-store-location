import { useState } from 'react'
import GoogleApi from 'app/component/onboarding/googleApi'
import DesignMap from 'app/component/onboarding/designMap'
import ManageLocation from 'app/component/onboarding/manageLocation'
import AddMapToStore from 'app/component/onboarding/addMapToStore'
import { LoaderFunctionArgs, useLoaderData } from 'react-router'
import { authenticate } from 'app/shopify.server'

export async function loader({request}: LoaderFunctionArgs) {
    const { admin, session } = await authenticate.admin(request);

    const query = `
        query {
        themes(first: 10) {
            edges {
            node {
                id
                name
                role
            }
            }
        }
        }
    `;

    const response = await admin.graphql(query);
    const data = await response.json();

    const mainTheme = data.data.themes.edges.find(
        (edge: any) => edge.node.role === "MAIN"
    );

    const themeGid = mainTheme.node.id;
    const themeId = themeGid.split("/").pop(); // số ID

    const storeHandle = session.shop.replace(".myshopify.com", "");

    const themeEditorUrl = `https://admin.shopify.com/store/${storeHandle}/themes/${themeId}/editor`;

    return themeEditorUrl
}

export default function Onboarding () {
    const [index, setIndex] = useState<number | null>(0)
    const themeEditorUrl = useLoaderData()
    return (
        <s-page heading='Store Locator'>
            <s-stack paddingInline="small">
                <h2>Welcome to Store Locator</h2>

                <s-stack direction="inline" justifyContent="space-between" alignItems="start">
                    <s-stack inlineSize="34%" gap="base">
                        <s-stack background="base" padding="base" borderRadius="large" borderWidth="small" direction="inline" justifyContent="space-between">
                            <s-stack>
                                <s-thumbnail size="large" src='/shop.png'></s-thumbnail>
                            </s-stack>
                            <s-stack inlineSize="66%">
                                <h2 style={{marginTop:"0"}}>Welcome to Store Locator</h2>
                                <s-paragraph>Automatically update the list of stores in your store locator tool.</s-paragraph>
                            </s-stack>
                        </s-stack>
                    </s-stack>
                        
                    <s-stack inlineSize="64%" background="base" padding="base" borderRadius="large" borderWidth="small" gap="base">
                        <s-stack direction="inline" justifyContent="start" gap="base">
                            <s-stack>
                                <s-icon type="incentive" />
                            </s-stack>
                            <s-stack>
                                <h2 style={{marginTop:"0", marginBottom:'8px'}}>Getting Started with Store Locator</h2>
                                <s-paragraph>A step-by-step guide to configuring the app to suit your business needs.</s-paragraph>
                            </s-stack>
                        </s-stack>

                        <s-stack>
                            <s-divider></s-divider>
                            <s-clickable onClick={() => setIndex(index === 0 ? null : 0)} background={index === 0 ? 'subdued' : 'base'}>
                                <s-stack direction='inline' justifyContent='space-between' padding='small'>
                                    <s-stack>Configure Integrations & Import Locations</s-stack>
                                    <s-stack>
                                        {
                                            index === 0 ?
                                            <s-icon type='caret-up'/>
                                            :
                                            <s-icon type='caret-down'/>
                                        }   
                                    </s-stack>
                                </s-stack>
                            </s-clickable>
                            {index === 0 && <GoogleApi />}
                            <s-divider></s-divider>       
                            <s-clickable onClick={() => setIndex(index === 1 ? null : 1)} background={index === 1 ? 'subdued' : 'base'}>
                                <s-stack direction='inline' justifyContent='space-between' padding='small'>
                                    <s-stack>Design Your Map</s-stack>
                                    <s-stack>
                                        {
                                            index === 1 ?
                                            <s-icon type='caret-up'/>
                                            :
                                            <s-icon type='caret-down'/>
                                        }   
                                    </s-stack>
                                </s-stack>
                            </s-clickable>
                            {index === 1 && <DesignMap />}   
                            <s-divider></s-divider>       
                            <s-clickable onClick={() => setIndex(index === 2 ? null : 2)} background={index === 2 ? 'subdued' : 'base'}>
                                <s-stack direction='inline' justifyContent='space-between' padding='small'>
                                    <s-stack>Manage Your Locations</s-stack>
                                    <s-stack>
                                        {
                                            index === 2 ?
                                            <s-icon type='caret-up'/>
                                            :
                                            <s-icon type='caret-down'/>
                                        }   
                                    </s-stack>
                                </s-stack>
                            </s-clickable>
                            {index === 2 && <ManageLocation />}  
                            <s-divider></s-divider>       
                            <s-clickable onClick={() => setIndex(index === 3 ? null : 3)} background={index === 3 ? 'subdued' : 'base'}>
                                <s-stack direction='inline' justifyContent='space-between' padding='small'>
                                    <s-stack>Add Your Map To Your Store</s-stack>
                                    <s-stack>
                                        {
                                            index === 3 ?
                                            <s-icon type='caret-up'/>
                                            :
                                            <s-icon type='caret-down'/>
                                        }   
                                    </s-stack>
                                </s-stack>
                            </s-clickable>
                            {index === 3 && <AddMapToStore themeEditorUrl={themeEditorUrl}/>}  
                        </s-stack>
                    </s-stack>
                </s-stack>
            </s-stack>
        </s-page>
    )
}