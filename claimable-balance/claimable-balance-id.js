import React from 'react'
import {shortenString} from '@stellar-expert/formatter'
import {formatExplorerLink} from '../ledger/ledger-entry-href-formatter'

export function ClaimableBalanceId({balance}) {
    if (!balance)
        return null
    return <>{' '}
        <a href={formatExplorerLink('claimable-balance', balance)} target="_blank">
            {shortenString(balance)}
        </a>
    </>
}