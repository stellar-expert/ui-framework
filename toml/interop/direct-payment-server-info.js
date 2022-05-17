class DirectPaymentServerInfo {
    constructor({enabled, fee_fixed, fee_percent, min_amount, max_amount, sender_sep12_type, receiver_sep12_type, fields}) {
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
        if (sender_sep12_type) {
            this.senderKycType = sender_sep12_type
        }
        if (receiver_sep12_type) {
            this.receiverKycType = receiver_sep12_type
        }
        if (fields) {
            this.fields = fields
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

    senderKycType = ''

    receiverKycType = ''

    /**
     * @type {Object.<string, Array<TransferServerEndpointInfo>>}
     */
    fields
}

class DirectPaymentServerRequestField {
    constructor({description, choices, optional}) {
        this.description = description
        if (choices) {
            this.choices = choices
        }
        if (optional) {
            this.optional = true
        }
    }

    /**
     * @type {String}
     */
    description

    /**
     * @type {Array<String>}
     */
    choices

    /**
     * @type {boolean}
     */
    optional = false
}

/**
 *
 * @param {String} directPaymentServer
 */
export function fetchDirectPaymentServerInfo(directPaymentServer) {
    return fetch(`${directPaymentServer}/info`)
        .then(resp => {
            if (!resp.ok) throw new Error('Failed to load')
            return resp.json()
        })
        .then(info => {
            return Object.keys(info.receive).map(token => {
                const tokenInfo = new DirectPaymentServerInfo(info.receive[token])
                tokenInfo.assetCode = token
                return tokenInfo
            })
        })
}