/**
 * Retrieve data from the server API endpoint.
 * @param {string} endpointWithQuery
 * @return {Promise<Object>}
 */
export async function fetchExplorerApi(endpointWithQuery) {
    const url = `${explorerApiOrigin}/explorer/${endpointWithQuery}`
    try {
        const resp = await fetch(url)
        if (!resp.ok) {
            let errorExt
            try {
                errorExt = await resp.json()
            } catch (parsingError) {
                errorExt = {}
            }
            const err = new Error(errorExt?.error || resp.statusText || 'Failed to fetch data from the server')
            err.status = resp.status
            err.ext = errorExt
            throw err
        }
        return await resp.json()
    } catch (e) {
        console.error(e)
        if (e instanceof Error) {
            e = {
                error: e.message,
                status: e.status || 500,
                ext: e.ext
            }
        }
        if (e.ext && e.ext.status) {
            e.status = e.ext.status
        }
        return e
    }
}