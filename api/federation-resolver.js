/**
 * Resolve federation address for account through federation server specified in stellar.toml
 * @param {Object} tomlData - Parsed toml data
 * @param {String} accountAddress - Account address to look for
 * @return {Promise<String>}
 */
export function resolveFederationAddress(tomlData, accountAddress) {
    const {federation_server} = tomlData
    if (!federation_server) return Promise.resolve(null)
    return fetch(`${federation_server}?q=${accountAddress}&type=id`)
        .then(resp => {
            if (!resp.ok) throw new Error('Failed to load')
            return resp.json()
        })
        .then(raw => raw.stellar_address || null)
        .catch(e => {
            console.error(e)
            return null
        })
}

/**
 * Resolve account public key for a given federation address through federation server specified in stellar.toml
 * @param {Object} tomlData - Parsed toml data
 * @param {String} federationAddress - Federation address
 * @return {Promise<String>}
 */
export function resolveAccountAddress(tomlData, federationAddress) {
    const {federation_server} = tomlData
    if (!federation_server) return Promise.resolve(null)
    return fetch(`${federation_server}?q=${federationAddress}&type=name`)
        .then(resp => {
            if (!resp.ok) throw new Error('Failed to load')
            return resp.json()
        })
        .then(raw => raw.account_id || null)
        .catch(e => {
            console.error(e)
            return null
        })
}