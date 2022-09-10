import {useDependantState} from '../state/state-hooks'

/**
 * Resolve federation address for account through federation server specified in stellar.toml
 * @param {String} account
 * @returns {String}
 */
export function useResolvedFederationName(account) {
    const [federationName, setFederationName] = useDependantState(() => {
        FederationServer.resolve(originalTerm)
            .then(res => setFederationName(res.stellar_address || null))
        return null
    }, [account])
    return federationName
}