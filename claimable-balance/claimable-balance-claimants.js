import React from 'react'
import {AccountAddress} from '../account/account-address'
import {xdrParseClaimant} from './claim-condtions-xdr-parser'

export function ClaimableBalanceClaimants({claimants}) {
    const parsed = claimants.map(xdrParseClaimant)
    return <>
        {parsed.map((c, i) => <span key={i + c.destination}>{i > 0 && ', '}
            <AccountAddress account={c.destination}/> {c.predicate}
        </span>)}
    </>
}