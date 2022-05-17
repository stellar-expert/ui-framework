class AssetTransferInfo {
    constructor({enabled, fee_fixed, fee_percent, min_amount, max_amount, authentication_required}, assetCode) {
        this.assetCode = assetCode
        if (enabled) {
            this.enabled = true
        }
        if (fee_fixed) {
            this.feeFixed = parseFloat(fee_fixed)
        }
        if (fee_percent) {
            this.feePercent = parseFloat(fee_percent)
        }
        if (min_amount) {
            this.minAmount = parseFloat(min_amount)
        }
        if (max_amount) {
            this.maxAmount = parseFloat(max_amount)
        }
        if (authentication_required) {
            this.authRequired = true
        }
    }

    /**
     * @type {string}
     */
    assetCode = ''
    /**
     * @type {boolean}
     */
    enabled = false
    /**
     * @type {boolean}
     */
    authRequired = false
    /**
     * @type {number}
     */
    minAmount = 0
    /**
     * @type {number}
     */
    maxAmount = 0
    /**
     * @type {number}
     */
    feeFixed = 0
    /**
     * @type {number}
     */
    feePercent = 0
}

class TransferServerEndpointInfo {
    constructor(info) {
        if (info.enabled === true) {
            this.enabled = true
        }
        if (info.authentication_required === true) {
            this.authRequired = true
        }
    }

    /**
     * @type {boolean}
     */
    enabled = false
    /**
     * @type {boolean}
     */
    authRequired = false
}

class TransferServerInfo {
    constructor({deposit, withdraw, ...otherEndpoints}, endpoint) {
        this.endpoint = endpoint
        this.deposit = {}
        for (let assetCode of Object.keys(deposit)) {
            this.deposit[assetCode] = new AssetTransferInfo(deposit[assetCode], assetCode)
        }
        this.withdraw = {}
        for (let assetCode of Object.keys(withdraw)) {
            this.withdraw[assetCode] = new AssetTransferInfo(withdraw[assetCode], assetCode)
        }
        this.endpoints = {}
        for (let key of Object.keys(otherEndpoints))
            if (otherEndpoints[key]) {
                this.endpoints[key] = new TransferServerEndpointInfo(otherEndpoints[key])
            }
    }

    endpoint
    /**
     * @type {Object.<string, AssetTransferInfo>}
     */
    deposit = null
    /**
     * @type {Object.<string, AssetTransferInfo>}
     */
    withdraw = null
    /**
     * @type {Object.<string, TransferServerEndpointInfo>}
     */
    endpoints = null
}

/**
 *
 * @param {String} transferServer
 */
export function fetchTransferServerInfo(transferServer) {
    return fetch(`${transferServer}/info`)
        .then(resp => {
            if (!resp.ok) throw new Error('Failed to load')
            return resp.json()
        })
        .then(info => new TransferServerInfo(info, transferServer))
}