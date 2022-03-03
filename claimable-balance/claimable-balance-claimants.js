import React from 'react'
import {xdrParseClaimant} from '@stellar-expert/claimable-balance-utils'
import {AccountAddress} from '../account/account-address'

export function ClaimableBalanceClaimants({claimants}) {
    const parsed = claimants.map(xdrParseClaimant)
    return <>
        {parsed.map((c, i) => <span key={i + c.destination}>{i > 0 && ', '}
            <AccountAddress account={c.destination}/> {c.predicate}
        </span>)}
    </>
}