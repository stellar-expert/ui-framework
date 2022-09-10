import {FederationServer} from 'stellar-sdk'
import {useDependantState} from '../state/state-hooks'

/**
 * Resolve federation address for account through federation server specified in stellar.toml
 * @param {String} account
 * @returns {String}
 */
export function useResolvedFederationName(account) {
    const [federationName, setFederationName] = useDependantState(() => {
        FederationServer.resolve(account)
            .then(res => setFederationName(res.stellar_address || null))
            .catch(e => console.error(e))
        return null
    }, [account])
    return federationName
}