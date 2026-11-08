import {useEffect, useState} from 'react'
import {loadTransaction} from '../api/explorer-tx-api'
import {applyTxEffects} from './parser/tx-details-parser'

/**
 * Lazily retrieve transaction effects from the server and attach them to the parsed transaction
 * @param {ParsedTxDetails} parsedTx - Parsed transaction (updated in place once effects are loaded)
 * @param {boolean} enabled - Whether effects are requested (e.g. operation details expanded)
 * @return {{loading: boolean, error: string|null}}
 */
export function useTxEffects(parsedTx, enabled) {
    const [state, setState] = useState({loading: false, error: null})
    const required = enabled && !parsedTx.isEphemeral && !parsedTx.effectsLoaded
    useEffect(() => {
        if (!required)
            return
        let active = true
        setState({loading: true, error: null})
        loadTransaction(parsedTx.txHash, {effects: true})
            .then(res => {
                if (res.error)
                    throw new Error(res.error)
                //effects stay attached to the parsed tx even if the component no longer needs them
                applyTxEffects(parsedTx, res.effects ?? null)
                if (active) {
                    setState({loading: false, error: null})
                }
            })
            .catch(e => {
                console.error(e)
                if (active) {
                    setState({loading: false, error: e.message || 'Failed to load transaction effects'})
                }
            })
        return () => {
            active = false
        }
    }, [parsedTx, required])
    return state
}
