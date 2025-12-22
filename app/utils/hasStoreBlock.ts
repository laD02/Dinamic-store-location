export async function hasStoreLocatorBlock(
    admin: any, 
    appHandle: string = 'store-locator' // Thay bằng app handle thật của bạn
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

        // Tìm app handle cụ thể của bạn
        const appPattern = new RegExp(`apps/${appHandle}|shopify://apps/[^/]+/blocks/${appHandle}`, 'i')

        return files.some((file: any) => {
            const content = file.node.body?.content
            return content && appPattern.test(content)
        })

    } catch (error) {
        console.error('Error checking app block:', error)
        return false
    }
}