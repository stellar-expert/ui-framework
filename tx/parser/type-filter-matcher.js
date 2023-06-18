const operatinTypeMap = {
    createAccount: 0,
    payment: 1,
    pathPaymentStrictReceive: 2,
    pathPaymentStrictSend: 13,
    createPassiveSellOffer: 4,
    manageSellOffer: 3,
    manageBuyOffer: 12,
    setOptions: 5,
    changeTrust: 6,
    allowTrust: 7,
    accountMerge: 8,
    inflation: 9,
    manageData: 10,
    bumpSequence: 11,
    createClaimableBalance: 14,
    claimClaimableBalance: 15,
    beginSponsoringFutureReserves: 16,
    endSponsoringFutureReserves: 17,
    revokeSponsorship: 18,
    clawback: 19,
    clawbackClaimableBalance: 20,
    setTrustLineFlags: 21,
    liquidityPoolDeposit: 22,
    liquidityPoolWithdraw: 23
}

export class TypeFilterMatcher {
    /**
     * @param {String[]} filters
     */
    constructor(filters) {
        if (!filters?.length)
            return
        this.types = new Set()
        for (const filter of filters) {
            this.processFilter(filter)
        }
    }

    /**
     * @type {Set}
     * @readonly
     * @private
     */
    types

    /**
     * Get unique set of type filters
     * @return {Boolean}
     */
    match(operationType) {
        return !this.types || this.types.has(operatinTypeMap[operationType])
    }

    /**
     * @param {String} filter
     * @private
     */
    processFilter(filter) {
        for (const type of this.decodeFilter(filter)) {
            this.types.add(type)
        }
    }

    /**
     * @param {String} filter
     * @private
     */
    decodeFilter(filter) {
        switch (filter) {
            case 'payments':
                return [
                    operatinTypeMap.createAccount,
                    operatinTypeMap.accountMerge,
                    operatinTypeMap.payment,
                    operatinTypeMap.pathPaymentStrictReceive,
                    operatinTypeMap.pathPaymentStrictSend,
                    operatinTypeMap.createClaimableBalance,
                    operatinTypeMap.claimClaimableBalance,
                    operatinTypeMap.clawback,
                    operatinTypeMap.clawbackClaimableBalance,
                    operatinTypeMap.inflation
                ]
            case 'trustlines':
                return [
                    operatinTypeMap.changeTrust,
                    operatinTypeMap.allowTrust,
                    operatinTypeMap.setTrustLineFlags
                ]
            case 'dex':
                return [
                    operatinTypeMap.manageSellOffer,
                    operatinTypeMap.manageBuyOffer,
                    operatinTypeMap.createPassiveSellOffer,
                    operatinTypeMap.liquidityPoolDeposit,
                    operatinTypeMap.liquidityPoolWithdraw
                ]
            case 'settings':
                return [
                    operatinTypeMap.createAccount,
                    operatinTypeMap.setOptions,
                    operatinTypeMap.changeTrust,
                    operatinTypeMap.allowTrust,
                    operatinTypeMap.accountMerge,
                    operatinTypeMap.inflation,
                    operatinTypeMap.manageData,
                    operatinTypeMap.bumpSequence,
                    operatinTypeMap.beginSponsoringFutureReserves,
                    operatinTypeMap.endSponsoringFutureReserves,
                    operatinTypeMap.revokeSponsorship,
                    operatinTypeMap.setTrustLineFlags
                ]
            default:
                return [parseInt(filter, 10)]
        }
    }
}