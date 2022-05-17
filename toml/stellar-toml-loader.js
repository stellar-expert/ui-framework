import {parseToml} from './stellar-toml-parser'
import {InMemoryClientCache} from '@stellar-expert/client-cache'

const tomlCache = new InMemoryClientCache({cleanupInterval: 30})

/**
 * Load stellar.toml from the given domain.
 * @param {string} domain - Anchor domain.
 * @return {Promise<TomlParsingResult>}
 */
export async function loadStellarToml(domain) {
    try {
        let promise = tomlCache.get(domain)
        if (!promise) {
            promise = fetch(`https://${domain}/.well-known/stellar.toml`, {
                cache: 'no-cache',
                referrerPolicy: 'no-referrer'
            })
                .then(res => {
                    if (!res.ok) return Promise.reject(new Error('Failed to load'))
                    return res.text()
                })
                .then(raw => {
                    const toml = parseToml(raw)
                    toml.raw = raw
                    toml.data.homeDomain = domain
                    return toml
                })
            tomlCache.set(domain, promise)
        }
        return await promise
    } catch (e) {
        console.error(e)
        throw new Error('Failed to load stellar.toml from ' + domain)
    }
}