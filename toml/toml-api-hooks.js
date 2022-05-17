import {useDependantState} from '../state/state-hooks'
import {loadStellarToml} from './stellar-toml-loader'
import {loadTomlInteropInfo} from './interop/toml-interop-loader'

/**
 * Download TOML data for a given home domain
 * @param {String} homeDomain
 * @returns {Object}
 */
export function useTomlData(homeDomain) {
    const [result, setResult] = useDependantState(() => {
        if (homeDomain) {
            loadStellarToml(homeDomain)
                .then(res => setResult({loaded: true, data: res.data, rawToml: res.raw}))
                .catch(e => {
                    console.error(e)
                    setResult({loaded: true, data: null, error: e})
                })
            return {loaded: false, data: null}
        }
        return {loaded: true, data: null}
    }, [homeDomain])
    return result
}

/**
 * Retirieve asset interoperability info from the TOML data
 * @param {} tomlInfo
 * @returns {Object}
 */
export function useTomlInteropInfo(tomlInfo) {
    const [result, setResult] = useDependantState(() => {
        if (tomlInfo) {
            return loadTomlInteropInfo(tomlInfo)
                .then(data => setResult({loaded: true, data}))
                .catch(e => {
                    console.error(e)
                    setResult({loaded: true, data: null, error: e})
                })
        }
        return {loaded: false, data: null}
    }, [tomlInfo])
    return result
}