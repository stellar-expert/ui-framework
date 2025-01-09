const operationTypeMap = {
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
    liquidityPoolWithdraw: 23,
    invokeHostFunction: 24,
    bumpFootprintExpiration: 25,
    restoreFootprint: 26
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
        return !this.types || this.types.has(operationTypeMap[operationType])
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
                    operationTypeMap.createAccount,
                    operationTypeMap.accountMerge,
                    operationTypeMap.payment,
                    operationTypeMap.pathPaymentStrictReceive,
                    operationTypeMap.pathPaymentStrictSend,
                    operationTypeMap.createClaimableBalance,
                    operationTypeMap.claimClaimableBalance,
                    operationTypeMap.clawback,
                    operationTypeMap.clawbackClaimableBalance,
                    operationTypeMap.inflation
                ]
            case 'trustlines':
                return [
                    operationTypeMap.changeTrust,
                    operationTypeMap.allowTrust,
                    operationTypeMap.setTrustLineFlags
                ]
            case 'dex':
                return [
                    operationTypeMap.manageSellOffer,
                    operationTypeMap.manageBuyOffer,
                    operationTypeMap.createPassiveSellOffer,
                    operationTypeMap.liquidityPoolDeposit,
                    operationTypeMap.liquidityPoolWithdraw
                ]
            case 'settings':
                return [
                    operationTypeMap.createAccount,
                    operationTypeMap.setOptions,
                    operationTypeMap.changeTrust,
                    operationTypeMap.allowTrust,
                    operationTypeMap.accountMerge,
                    operationTypeMap.inflation,
                    operationTypeMap.manageData,
                    operationTypeMap.bumpSequence,
                    operationTypeMap.beginSponsoringFutureReserves,
                    operationTypeMap.endSponsoringFutureReserves,
                    operationTypeMap.revokeSponsorship,
                    operationTypeMap.setTrustLineFlags
                ]
            case 'contracts':
                return [
                    operationTypeMap.invokeHostFunction,
                    operationTypeMap.bumpFootprintExpiration,
                    operationTypeMap.restoreFootprint
                ]
            default:
                return [parseInt(filter, 10)]
        }
    }
}