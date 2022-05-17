import {useDependantState, resolveFederationAddress} from '@stellar-expert/ui-framework'
import {useTomlData} from '../toml/toml-api-hooks'

/**
 * Resolve federation address for account through federation server specified in stellar.toml
 * @param {String} account
 * @returns {String}
 */
export function useResolvedFederationName(account, homeDomain) {
    const {loaded, data: tomlData} = useTomlData(homeDomain) //account?.ledgerData?.home_domain
    const [result, setResult] = useDependantState(() => {
        if (tomlData) {
            resolveFederationAddress(tomlData, account.address)
                .then(address => {
                    setResult(address)
                })
        }
        return null
    }, [account, tomlData])
    return result
}