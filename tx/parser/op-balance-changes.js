const manageOfferOpTypes = ['manageSellOffer', 'manageBuyOffer', 'createPassiveSellOffer']

/**
 * Calculate operation resulting balance changes
 * @param {{}} op - Operation descriptor
 * @return {{amount: String, source: String, type: String, asset: String}[]}
 */
export function retrieveOpBalanceChanges(op) {
    const account = op.tx?.context?.account
    if (typeof account !== 'string')
        return []
    const {effects} = op.operation
    const changes = effects.filter(e => e.source === account && (e.type === 'accountDebited' || e.type === 'accountCredited'))
    if (changes.length) {
        changes.sort((a, b) => a.type - b.type)
        return changes
    }

    /*if (manageOfferOpTypes.includes(op.operation.type)) {
        const debitedAmounts = []
        const creditedAmounts = []
        let sourceAsset
        let destAsset

        for (let e of effects) {
            if (![e.seller, e.source].includes(op.context) || e.type !== 'trade')
                continue
            let {amount} = e
            sourceAsset = e.asset[1]
            destAsset = e.asset[0]
            if (e.seller === op.context) {
                amount = amount.slice().reverse()
                sourceAsset = e.asset[1]
                destAsset = e.asset[0]
            }
            debitedAmounts.push(amount[1])
            creditedAmounts.push(amount[0])
        }
        const res = []
        if (debitedAmounts.length) {
            res.push({
                type: 'accountDebited',
                source: op.context,
                asset: sourceAsset,
                amount: sumAmounts(debitedAmounts)
            })
        }

        if (creditedAmounts.length) {
            res.push({
                type: 'accountCredited',
                source: op.context,
                asset: destAsset,
                amount: sumAmounts(creditedAmounts)
            })
        }
        return res
    }*/
    return []
}

/*

function sumAmounts(amounts) {
    return amounts.reduce((prev, v) => prev.add(v), new Bignumber(0))
}*/
