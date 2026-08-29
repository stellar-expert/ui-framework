import {xdr} from '@stellar/stellar-sdk'
import {
    AssetDescriptor,
    ContractAssetDescriptor,
    LiquidityPoolDescriptor,
    generateLiquidityPoolId,
    getLiquidityPoolAsset,
    isAssetValid,
    isValidAssetCode,
    isValidContract,
    isValidPoolId,
    parseAssetFromObject
} from '../asset-descriptor/index.js'

const issuer = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'
const contract = 'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE'

describe('AssetDescriptor', () => {
    test('native asset', () => {
        expect(AssetDescriptor.native.toString()).toBe('XLM')
        expect(AssetDescriptor.native.isNative).toBe(true)
        expect(new AssetDescriptor('XLM').type).toBe(0)
    })

    test('parses CODE-ISSUER form', () => {
        const a = AssetDescriptor.parse(`USDC-${issuer}`)
        expect(a.code).toBe('USDC')
        expect(a.issuer).toBe(issuer)
        expect(a.toFQAN()).toBe(`USDC-${issuer}-1`)
        expect(a.toCurrency()).toBe('USDC')
    })

    test('type is derived from code length', () => {
        expect(new AssetDescriptor(`USDC-${issuer}`).type).toBe(1)
        expect(new AssetDescriptor(`LONGASSET-${issuer}`).type).toBe(2)
    })

    test('toAsset() produces an SDK Asset', () => {
        const asset = AssetDescriptor.parse(`USDC-${issuer}`).toAsset()
        expect(asset.getCode()).toBe('USDC')
        expect(asset.getIssuer()).toBe(issuer)
        expect(AssetDescriptor.native.toAsset().isNative()).toBe(true)
    })

    test('rejects malformed input', () => {
        expect(() => new AssetDescriptor('USDC-NOPE')).toThrow()
        expect(() => new AssetDescriptor('!!-' + issuer)).toThrow()
        expect(isAssetValid('XLM')).toBe(true)
        expect(isAssetValid('nonsense')).toBe(false)
    })

    test('equality compares canonical form', () => {
        expect(AssetDescriptor.parse(`USDC-${issuer}`).equals(new AssetDescriptor('USDC', issuer))).toBe(true)
        expect(AssetDescriptor.native.equals(null)).toBe(false)
    })
})

describe('ContractAssetDescriptor', () => {
    test('parses a contract address', () => {
        const c = AssetDescriptor.parse(contract)
        expect(c).toBeInstanceOf(ContractAssetDescriptor)
        expect(c.isContract).toBe(true)
        expect(c.type).toBe(4)
        expect(c.toString()).toBe(contract)
        expect(() => c.toAsset()).toThrow()
    })
})

describe('LiquidityPoolDescriptor', () => {
    test('generateLiquidityPoolId returns a 64-char hex string', () => {
        const id = generateLiquidityPoolId(['XLM', `USDC-${issuer}`])
        expect(id).toMatch(/^[0-9a-f]{64}$/)
        expect(id).not.toContain(',')
    })

    test('pool id is stable regardless of asset order', () => {
        const a = generateLiquidityPoolId(['XLM', `USDC-${issuer}`])
        const b = generateLiquidityPoolId([`USDC-${issuer}`, 'XLM'])
        expect(a).toBe(b)
    })

    test('rejects a pool of identical assets', () => {
        expect(getLiquidityPoolAsset(['XLM', 'XLM'])).toBeNull()
        expect(generateLiquidityPoolId(['XLM', 'XLM'])).toBeNull()
    })

    test('hex pool id decodes to an L-strkey', () => {
        const id = generateLiquidityPoolId(['XLM', `USDC-${issuer}`])
        const pool = AssetDescriptor.parse(id)
        expect(pool).toBeInstanceOf(LiquidityPoolDescriptor)
        expect(pool.type).toBe(3)
        expect(pool.poolId).toMatch(/^L[A-Z2-7]{55}$/)
        //the strkey body must be the same 32 bytes the hex id describes
        expect(new LiquidityPoolDescriptor(pool.poolId).poolId).toBe(pool.poolId)
    })

    test('accepts an already-encoded L-strkey unchanged', () => {
        const id = generateLiquidityPoolId(['XLM', `USDC-${issuer}`])
        const strkey = new LiquidityPoolDescriptor(id).poolId
        expect(new LiquidityPoolDescriptor(strkey).poolId).toBe(strkey)
    })

    test('toAsset() is unsupported', () => {
        const id = generateLiquidityPoolId(['XLM', `USDC-${issuer}`])
        expect(() => AssetDescriptor.parse(id).toAsset()).toThrow()
    })
})

describe('validation helpers', () => {
    test('isValidAssetCode', () => {
        expect(isValidAssetCode('USDC')).toBe(true)
        expect(isValidAssetCode('')).toBe(false)
        expect(isValidAssetCode('THIRTEENCHARS')).toBe(false)
    })

    test('isValidContract', () => {
        expect(isValidContract(contract)).toBe(true)
        expect(isValidContract(issuer)).toBe(false)
    })

    test('isValidPoolId accepts hex, strkey and raw bytes', () => {
        const hex = generateLiquidityPoolId(['XLM', `USDC-${issuer}`])
        expect(isValidPoolId(hex)).toBe(true)
        expect(isValidPoolId(new LiquidityPoolDescriptor(hex).poolId)).toBe(true)
        expect(isValidPoolId(xdr.decodeBytes(hex, 'hex'))).toBe(true)
        expect(isValidPoolId(new Uint8Array(31))).toBe(false)
        expect(isValidPoolId('nope')).toBe(false)
    })
})

describe('parseAssetFromObject', () => {
    test('native', () => {
        expect(parseAssetFromObject({asset_type: 'native'}).toString()).toBe('XLM')
    })

    test('credit asset from split fields', () => {
        const a = parseAssetFromObject({asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: issuer})
        expect(a.toFQAN()).toBe(`USDC-${issuer}-1`)
    })

    test('honours the field prefix', () => {
        const a = parseAssetFromObject({selling_asset_type: 'native'}, 'selling_')
        expect(a.toString()).toBe('XLM')
    })
})
