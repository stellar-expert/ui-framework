import React from 'react'
import {xdrParseClaimant} from '@stellar-expert/claimable-balance-utils'
import {AccountAddress} from '../account/account-address'
import {CodeBlock} from '../controls/code-block'

export const ClaimableBalanceClaimants = React.memo(function ClaimableBalanceClaimants({claimants}) {
    const parsed = claimants.map(c => {
        if (c.destination && c.predicate)
            return c
        return xdrParseClaimant(c)
    })
    return <>
        {parsed.map((c, i) => <span key={i + c.destination}>{i > 0 && ', '}
            <AccountAddress account={c.destination}/> {typeof c.predicate === 'string' ?
                c.predicate :
                <div className="block-indent"><CodeBlock>{JSON.stringify(c.predicate, null, 2)}</CodeBlock></div>}
        </span>)}
    </>
})