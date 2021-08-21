import {StrKey, Asset} from 'stellar-sdk'
import {formatLongHex} from '../numeric/formatting-utils'

function normalizeType(code, type) {
    switch (type) {
        case 'credit_alphanum4':
            return 1
        case 'credit_alphanum12':
            return 2
        default: //autodetect type
            return code.length > 4 ? 2 : 1
    }
}

const nativeAssetCode = 'XLM'

function isValidAssetCode(code) {
    return /^[a-zA-Z0-9]{1,12}$/.test(code)
}

/**
 * Stellar Asset definition.
 */
export class AssetDescriptor {
    /**
     * Creates an instance of the Asset
     * @param codeOrFullyQualifiedName {String} - Asset code or fully qualified asset name in CODE-ISSUER-TYPE format.
     * @param issuer [String] - Asset issuer account public key.
     * @param type [String] - Asset type. One of ['credit_alphanum4', 'credit_alphanum12', 'native'].
     */
    constructor(codeOrFullyQualifiedName, issuer, type) {
        if (codeOrFullyQualifiedName instanceof AssetDescriptor) {
            //clone Asset
            ['code', 'type', 'issuer'].forEach(field => this[field] = codeOrFullyQualifiedName[field])
        } else if (issuer !== undefined) {
            this.code = codeOrFullyQualifiedName
            this.type = normalizeType(codeOrFullyQualifiedName, type)
            this.issuer = issuer
        } else if (((codeOrFullyQualifiedName === nativeAssetCode || codeOrFullyQualifiedName === 'native') && !type) || type === 0) {
            this.type = 0
            this.code = nativeAssetCode
        } else {
            if (!codeOrFullyQualifiedName || typeof codeOrFullyQualifiedName !== 'string' || codeOrFullyQualifiedName.length < 3)
                throw new TypeError(`Invalid asset name: ${codeOrFullyQualifiedName}.`)
            const separator = codeOrFullyQualifiedName.includes(':') ? ':' : '-'
            const parts = codeOrFullyQualifiedName.split(separator)
            if (parts.length < 2)
                throw new TypeError(`Invalid asset name: ${codeOrFullyQualifiedName}.`)
            this.code = parts[0]
            this.issuer = parts[1]
            this.type = normalizeType(this.code, parts[2])
        }
        if (this.type !== 0 && !StrKey.isValidEd25519PublicKey(this.issuer)) throw new Error('Invalid asset issuer address: ' + this.issuer)
        if (!isValidAssetCode(this.code)) throw new Error('Invalid asset code: ' + this.code)
        //if (!this.code || !/^[a-zA-Z0-9]{1,12}$/.test(this.code)) throw new Error(`Invalid asset code. See https://www.stellar.org/developers/guides/concepts/assets.html#alphanumeric-4-character-maximum`)
        Object.freeze(this)
    }

    get isNative() {
        return this.type === 0
    }

    equals(anotherAsset) {
        if (!anotherAsset) return false
        return this.toString() === anotherAsset.toString()
    }

    /**
     * Returns Asset name in a CODE-ISSUER format (compatible with StellarSDK).
     * @returns {String}
     */
    toString() {
        if (this.isNative) return nativeAssetCode
        return `${this.code}-${this.issuer}`
    }

    /**
     * Returns a fully-qualified Asset unique name in a CODE-ISSUER-TYPE format.
     * @returns {String}
     */
    toFQAN() {
        if (this.isNative) return nativeAssetCode
        return `${this.code}-${this.issuer}-${this.type}`
    }

    /**
     * Formats Asset as a currency with optional maximum length.
     * @param issuerMaxLength {Number}
     * @returns {String}
     */
    toCurrency(issuerMaxLength) {
        if (this.isNative) return 'XLM'
        if (issuerMaxLength) {
            let issuerAllowedLength = issuerMaxLength - 1,
                shortenedIssuer = formatLongHex(this.issuer, issuerAllowedLength)

            return `${this.code}-${shortenedIssuer}`
        }
        return this.code
    }

    toJSON() {
        return this.toString()
    }

    /**
     * @return {Asset}
     */
    toAsset() {
        if (this.isNative) return Asset.native()
        return new Asset(this.code, this.issuer)
    }

    /**
     * Native asset type.
     * @returns {AssetDescriptor}
     */
    static get native() {
        return new AssetDescriptor(nativeAssetCode)
    }
}

/**
 * Parses asset from Horizon API response
 * @param obj {Object} - Object to parse data from.
 * @param prefix {String} - Optional field names prefix.
 * @returns {AssetDescriptor}
 */
export function parseAssetFromObject(obj, prefix = '') {
    const keyPrefix = prefix + 'asset'
    if (obj[keyPrefix])  //new format
        return new AssetDescriptor(obj[keyPrefix])
    const type = obj[keyPrefix + '_type']
    if (!type)
        throw new TypeError(`Invalid asset descriptor: ${JSON.stringify(obj)}. Prefix: ${prefix}`)
    if (type === 'native')
        return AssetDescriptor.native
    return new AssetDescriptor(obj[keyPrefix + '_code'], obj[keyPrefix + '_issuer'], obj[keyPrefix + '_type'])
}

export function isAssetValid(asset) {
    if (asset instanceof AssetDescriptor) return true
    if (typeof asset !== 'string') return false
    if (asset === 'XLM') return true
    const [code, issuer] = asset.split('-')
    return StrKey.isValidEd25519PublicKey(issuer) && isValidAssetCode(code)
}