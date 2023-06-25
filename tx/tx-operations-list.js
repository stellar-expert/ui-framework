import React from 'react'
import TxFeeEffect from './tx-fee-effect'
import {OpDescriptionView} from './op-description-view'
import {OpIcon} from './op-icon'
import {OpEffectsView} from './op-effects-view'
import {OpAccountingChanges, TxFeeAccountingChanges} from './op-accounting-changes'
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

function TxChargedFee({parsedTx, compact}) {
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
}

/**
 * @param {ParsedTxDetails} parsedTx - Transaction descriptor
 * @param {Boolean} [showFees] - Whether to display transaction fees
 * @param {Boolean} [compact] - Compact view (without fee charges and accounting changes effects)
 */
export function TxOperationsList({parsedTx, showFees = true, compact = false}) {
        return <div className="condensed">
        {showFees && <TxChargedFee {...{parsedTx, compact}}/>}
        {parsedTx.operations.map(op => <div className="op-container" key={op.txHash + op.order + op.isEphemeral}>
            <div className="op-layout">
                <OpIcon op={op}/>
                <div>
                    <OpDescriptionView key={parsedTx.txHash + op.order} op={op} compact={compact}/>
                </div>
                {!!compact && !op.isEphemeral && <OpAccountingChanges op={op}/>}
            </div>
            <OpEffectsView effects={op.effects}/>
        </div>)}
    </div>
}
