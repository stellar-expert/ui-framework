import React, {useCallback, useState} from 'react'
import {Spoiler} from '../interaction/spoiler'
import {OpEffectsView} from '../effect/op-effects-view'
import {OpAccountingChanges, TxFeeAccountingChanges} from './op-accounting-changes'
import TxFeeEffect from './tx-fee-effect'
import {OpDescriptionView} from './op-description-view'
import {OpIcon} from './op-icon'
import './op-description.scss'

/*
Every operation can be in one of the following states (detected automatically):
- Ephemeral
    - Pending (not processed by StellarCore yet)
    - Rejected (rejected by Horizon or StellarCore during execution)
- Applied
    - Processed (applied to the ledger and resulted in some on-chain state changes)
    - Processed without effects (applied to the ledger but yielded no changes in the ledger state)
- Failed during the execution

Display context
- Transaction context
    - All operations displayed
    - Source account always visible
    - No fee charges
    - Effects displayed
- Unfiltered view context
    - All operations displayed
    - Source account always visible
    - No fee charges
    - All effects displayed
- Filtered view context
    - Only operations related to the filter context (account/asset/order)
    - Source account always visible
    - Fee charges ony for account context
    - Effects related to the filter context
- Account history view context
    - Only operations DIRECTLY related to the current account (skip third-party operations for claimable balances, sponsorship, etc)
    - Source account displayed only when operation (or transaction) source account not matches current account
    - Fee charge effects displayed only if charged from the current account
    - Effects related to the current account
 */

const TxChargedFee = React.memo(function TxChargedFee({parsedTx, compact}) {
    if (parsedTx.isEphemeral || !parsedTx.context?.account)
        return null
    const fee = parsedTx.effects.find(e => e.type === 'feeCharged')
    if (!fee || !parsedTx.context.account.includes(fee.source))
        return null
    return <div className="op-container">
        <div className="op-layout">
            <OpIcon op="feeCharge"/>
            <TxFeeEffect feeEffect={fee} compact={compact}/>
            {!!compact && !parsedTx.isEphemeral && <TxFeeAccountingChanges amount={fee.charged}/>}
        </div>
    </div>
})

/**
 * @param {ParsedTxDetails} parsedTx - Transaction descriptor
 * @param {Function} [filter] - Filter matcher function
 * @param {Boolean} [showFees] - Whether to display transaction fees
 * @param {Boolean} [showEffects] - Whether to show operation effects
 * @param {Boolean} [compact] - Compact view (without fee charges and accounting changes effects)
 */
export const TxOperationsList = React.memo(function TxOperationsList({
                                                                         parsedTx,
                                                                         filter = null,
                                                                         showFees = true,
                                                                         compact = false,
                                                                         showEffects
                                                                     }) {
    const [effectsExpanded, setEffectsExpanded] = useState(false)
    const [opsExpanded, setOpsExpanded] = useState(false)
    const toggleEffects = useCallback(e => setEffectsExpanded(e.expanded), [])
    const toggleAdditionalOps = useCallback(e => setOpsExpanded(e.expanded), [])
    let {operations} = parsedTx
    let opdiff = 0
    if (!opsExpanded) {
        //filter operations if filtered output is requested
        if (filter) {
            const visibleOps = operations.filter(filter)
            if (visibleOps.length) {
                operations = visibleOps
                opdiff = parsedTx.operations.length - operations.length
            }
        }
        //hide some operations in large transactions to prevent interface hanging
        if (operations.length > 5) {
            operations = operations.slice(0, 5)
            opdiff = parsedTx.operations.length - operations.length
        }
    }

    return <div>
        {!compact && showEffects !== false &&
            <div className="tx-effects-toggle">
                <Spoiler micro active expanded={effectsExpanded} showLess="Hide operation effects" showMore="Show operation effects"
                         onChange={toggleEffects} style={{margin: '0.2em'}}/>
            </div>}
        <div className="condensed">
            {operations.map((op, i) => <div className="op-container" key={op.txHash + op.order + op.isEphemeral}>
                <div className="op-layout">
                    <OpIcon op={op}/>
                    <div>
                        <OpDescriptionView key={parsedTx.txHash + op.order} op={op} compact={compact}/>
                    </div>
                    {!!compact && !op.isEphemeral && <OpAccountingChanges op={op}/>}
                </div>
                {effectsExpanded && <OpEffectsView effects={op.operation.effects}/>}
            </div>)}
            {showFees && <TxChargedFee {...{parsedTx, compact}}/>}
        </div>
        {(opsExpanded || opdiff > 0) && <Spoiler className="text-tiny" expanded={opsExpanded} onChange={toggleAdditionalOps}
                                                 showMore={`${opdiff} more operation${opdiff > 1 && 's'} in this transaction`} showLess="Hide additional operations"/>}
    </div>
})
