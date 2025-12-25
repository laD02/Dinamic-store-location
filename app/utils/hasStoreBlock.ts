export async function hasStoreLocatorAddBlock(
    admin: any, 
    appHandle: string = 'store-locator'
): Promise<boolean> {
    try {
        const themeRes = await admin.graphql(`
            query {
                themes(first: 1, roles: MAIN) {
                    edges {
                        node { id }
                    }
                }
            }
        `)

        const themeData = await themeRes.json()
        const themeId = themeData?.data?.themes?.edges?.[0]?.node?.id
        
        if (!themeId) return false

        const filesRes = await admin.graphql(
            `query ($themeId: ID!) {
                theme(id: $themeId) {
                    files(first: 250) {
                        edges {
                            node {
                                filename
                                body {
                                    ... on OnlineStoreThemeFileBodyText {
                                        content
                                    }
                                }
                            }
                        }
                    }
                }
            }`,
            { variables: { themeId } }
        )

        const filesData = await filesRes.json()
        const files = filesData?.data?.theme?.files?.edges || []

        // Pattern match format: shopify://apps/store-locator/blocks/...
        const appBlockPattern = new RegExp(
            `shopify://apps/${appHandle}/blocks/`,
            'i'
        )

        return files.some((file: any) => {
            const filename = file.node.filename || ''
            const content = file.node.body?.content
            
            // Chỉ check trong sections/
            if (!filename.startsWith('sections/')) {
                return false
            }
            
            return content && appBlockPattern.test(content)
        })

    } catch (error) {
        console.error('Error checking app block:', error)
        return false
    }
}