import {Networks, TransactionBuilder} from '@stellar/stellar-sdk'
import {
    parseTxResult,
    buildFeeChargedEffect,
    retrieveClaimAtoms,
    retrievePathPaymentAmounts,
    retrieveClaimableBalanceId,
    retrieveInflationPayouts
} from '../tx/parser/tx-result-utils'
import {parseTxDetails, applyTxEffects} from '../tx/parser/tx-details-parser'

//fixtures from tx-meta-effects-parser test data; expected values match the effects the parser derives from tx meta

//circular arbitrage XLM -> XCN -> ETH -> XLM (pathPaymentStrictReceive)
const circularTx = 'AAAAAC0GXm2tv9a155M+HYT2mB6aJYZbwoYZfY0WBUMgQqQfAAAAZAEYrGAAAC5kAAAAAAAAAAAAAAABAAAAAAAAAAIAAAAAAAAAACBZR9AAAAAALQZeba2/1rXnkz4dhPaYHpolhlvChhl9jRYFQyBCpB8AAAAAAAAAACBZR9AAAAACAAAAAVhDTgAAAAAAm466+JY4VR3PnqT3QyBxEGuHqw4ts9abdaU4InL3WdgAAAABRVRIAAAAAABJM6gr7MVJw2l40YdnsRgjNh2EUh2oZh9Ds8wLt67FpAAAAAAAAAABIEKkHwAAAEAPfL0eIwz/L3/4oBpnPOpyQAjg/pJoy/r91lbh92ZjvzSWHcIY929d4zMrytgqbCYG/QfkSdWgIljkuXBSfj0A'
const circularResult = 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAACAAAAAAAAAAMAAAAABasflzSSfNo9Bk1QTsIcb08x2htXH9KuucjyPfyAk18AAAAAAUpT4wAAAAFYQ04AAAAAAJuOuviWOFUdz56k90MgcRBrh6sOLbPWm3WlOCJy91nYAAAAAEcAiGUAAAAAAAAAACBGD3QAAAAALFdICsI0NRv5zWe41MW7zgf/ONqaq5aD8Otq5z9YtMIAAAAAAUoqAgAAAAFFVEgAAAAAAEkzqCvsxUnDaXjRh2exGCM2HYRSHahmH0OzzAu3rsWkAAAAAAAFsHMAAAABWENOAAAAAACbjrr4ljhVHc+epPdDIHEQa4erDi2z1pt1pTgicvdZ2AAAAABHAIhlAAAAAF64vS0DYaxirVWTaqFoqF1fpNZaPbhDz0BuwL/imm6uAAAAAAFKbRIAAAAAAAAAACBZR9AAAAABRVRIAAAAAABJM6gr7MVJw2l40YdnsRgjNh2EUh2oZh9Ds8wLt67FpAAAAAAABbBzAAAAAC0GXm2tv9a155M+HYT2mB6aJYZbwoYZfY0WBUMgQqQfAAAAAAAAAAAgWUfQAAAAAA=='

//offers and pool crossed by manageBuyOffer (op 4), pathPaymentStrictReceive (op 7), pathPaymentStrictSend (op 8)
const crossTx = 'AAAAAgAAAABU95GyQJbC5BUk8MOfuB2kGJMPNikp/uVdnGQ9ALDarAABhqAAAJvZAAAACAAAAAEAAAAAAAAAAAAAAABjnO9DAAAAAAAAAAoAAAAAAAAAAwAAAAFVU0QAAAAAAFT3kbJAlsLkFSTww5+4HaQYkw82KSn+5V2cZD0AsNqsAAAAAAAAAAA7msoAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAEAAAAAUVVUgAAAAAAVPeRskCWwuQVJPDDn7gdpBiTDzYpKf7lXZxkPQCw2qwAAAABVVNEAAAAAABU95GyQJbC5BUk8MOfuB2kGJMPNikp/uVdnGQ9ALDarAAAAAA1pOkAAAAAYwAAAGQAAAABAAAAAGwpaFzT4YYOFQorR1hvkzU9himxtEbBMKbb/qeCkpPhAAAABgAAAAFVU0QAAAAAAFT3kbJAlsLkFSTww5+4HaQYkw82KSn+5V2cZD0AsNqsf/////////8AAAABAAAAAFT3kbJAlsLkFSTww5+4HaQYkw82KSn+5V2cZD0AsNqsAAAABwAAAABsKWhc0+GGDhUKK0dYb5M1PYYpsbRGwTCm2/6ngpKT4QAAAAFVU0QAAAAAAQAAAAEAAAAAbCloXNPhhg4VCitHWG+TNT2GKbG0RsEwptv+p4KSk+EAAAAMAAAAAAAAAAFVU0QAAAAAAFT3kbJAlsLkFSTww5+4HaQYkw82KSn+5V2cZD0AsNqsAAAAAAX14QAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAYAAAADAAAAAAAAAAFFVVIAAAAAAFT3kbJAlsLkFSTww5+4HaQYkw82KSn+5V2cZD0AsNqsAAAAAVVTRAAAAAAAVPeRskCWwuQVJPDDn7gdpBiTDzYpKf7lXZxkPQCw2qwAAAAeAABa8xB6QAAAAAAAAAAAFj5ZiPVtZsfVlGsy+ESuPO4P9ypdgigJudUCfMG4l6RzAAAAADuaygAAAAAAO5rKAAAAAAEAAAAKAAAACgAAAAEAAAABAAAAAGwpaFzT4YYOFQorR1hvkzU9himxtEbBMKbb/qeCkpPhAAAAAgAAAAAAAAAAdzWUAAAAAABU95GyQJbC5BUk8MOfuB2kGJMPNikp/uVdnGQ9ALDarAAAAAFFVVIAAAAAAFT3kbJAlsLkFSTww5+4HaQYkw82KSn+5V2cZD0AsNqsAAAAADWk6QAAAAACAAAAAVVTRAAAAAAAVPeRskCWwuQVJPDDn7gdpBiTDzYpKf7lXZxkPQCw2qwAAAABRVVSAAAAAABU95GyQJbC5BUk8MOfuB2kGJMPNikp/uVdnGQ9ALDarAAAAAEAAAAAbCloXNPhhg4VCitHWG+TNT2GKbG0RsEwptv+p4KSk+EAAAANAAAAAVVTRAAAAAAAVPeRskCWwuQVJPDDn7gdpBiTDzYpKf7lXZxkPQCw2qwAAAAABfXhAAAAAABU95GyQJbC5BUk8MOfuB2kGJMPNikp/uVdnGQ9ALDarAAAAAFFVVIAAAAAAFT3kbJAlsLkFSTww5+4HaQYkw82KSn+5V2cZD0AsNqsAAAAAAL68IAAAAAAAAAAAQAAAABsKWhc0+GGDhUKK0dYb5M1PYYpsbRGwTCm2/6ngpKT4QAAAAYAAAABVVNEAAAAAABU95GyQJbC5BUk8MOfuB2kGJMPNikp/uVdnGQ9ALDarAAAAAAAAAAAAAAAAAAAAAIAsNqsAAAAQJb0FLY5/K4C3a3qUOMSCvI0rOFTvB/OrtGnF2T2Rx6wAeeR9fKKxVD/PXoJQkZxcOGPjjv+Z5na+OrHj2RHtw2CkpPhAAAAQGfY2wg1oCIAK5S2EsQrmLZKjLn15ckl5nYPgPdB/fsLMCOS/JaghuyEWWSZNEUppCoxPjsOPCFFOo/MaEM8nAo='
const crossResult = 'AAAAAAAAw1AAAAAAAAAACgAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAFT3kbJAlsLkFSTww5+4HaQYkw82KSn+5V2cZD0AsNqsAAAAAAAAOfIAAAABVVNEAAAAAABU95GyQJbC5BUk8MOfuB2kGJMPNikp/uVdnGQ9ALDarAAAAAAAAAAAO5rKAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAABU95GyQJbC5BUk8MOfuB2kGJMPNikp/uVdnGQ9ALDarAAAAAAAADnzAAAAAUVVUgAAAAAAVPeRskCWwuQVJPDDn7gdpBiTDzYpKf7lXZxkPQCw2qwAAAABVVNEAAAAAABU95GyQJbC5BUk8MOfuB2kGJMPNikp/uVdnGQ9ALDarAAAAAA1pOkAAAAAYwAAAGQAAAABAAAAAAAAAAAAAAAGAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAMAAAAAAAAAAEAAAABAAAAAFT3kbJAlsLkFSTww5+4HaQYkw82KSn+5V2cZD0AsNqsAAAAAAAAOfIAAAABVVNEAAAAAABU95GyQJbC5BUk8MOfuB2kGJMPNikp/uVdnGQ9ALDarAAAAAAF9eEAAAAAAAAAAAAF9eEAAAAAAgAAAAAAAAAGAAAAAAAAAAAAAAAWAAAAAAAAAAAAAAACAAAAAAAAAAIAAAABAAAAAFT3kbJAlsLkFSTww5+4HaQYkw82KSn+5V2cZD0AsNqsAAAAAAAAOfIAAAABVVNEAAAAAABU95GyQJbC5BUk8MOfuB2kGJMPNikp/uVdnGQ9ALDarAAAAAA1G5TAAAAAAAAAAAA1G5TAAAAAAQAAAABU95GyQJbC5BUk8MOfuB2kGJMPNikp/uVdnGQ9ALDarAAAAAAAADnzAAAAAUVVUgAAAAAAVPeRskCWwuQVJPDDn7gdpBiTDzYpKf7lXZxkPQCw2qwAAAAANaTpAAAAAAFVU0QAAAAAAFT3kbJAlsLkFSTww5+4HaQYkw82KSn+5V2cZD0AsNqsAAAAADUblMAAAAAAVPeRskCWwuQVJPDDn7gdpBiTDzYpKf7lXZxkPQCw2qwAAAABRVVSAAAAAABU95GyQJbC5BUk8MOfuB2kGJMPNikp/uVdnGQ9ALDarAAAAAA1pOkAAAAAAAAAAA0AAAAAAAAAAQAAAAI+WYj1bWbH1ZRrMvhErjzuD/cqXYIoCbnVAnzBuJekcwAAAAFFVVIAAAAAAFT3kbJAlsLkFSTww5+4HaQYkw82KSn+5V2cZD0AsNqsAAAAAAVnYOEAAAABVVNEAAAAAABU95GyQJbC5BUk8MOfuB2kGJMPNikp/uVdnGQ9ALDarAAAAAAF9eEAAAAAAFT3kbJAlsLkFSTww5+4HaQYkw82KSn+5V2cZD0AsNqsAAAAAUVVUgAAAAAAVPeRskCWwuQVJPDDn7gdpBiTDzYpKf7lXZxkPQCw2qwAAAAABWdg4QAAAAAAAAAGAAAAAAAAAAA='
const issuer = 'GBKPPENSICLMFZAVETYMHH5YDWSBREYPGYUST7XFLWOGIPIAWDNKYDLI'
const pool = 'LA7FTCHVNVTMPVMUNMZPQRFOHTXA75ZKLWBCQCNZ2UBHZQNYS6SHHJLT'
const poolHex = '3e5988f56d66c7d5946b32f844ae3cee0ff72a5d822809b9d5027cc1b897a473'

const claimableBalanceResult = 'AAAAAAAAAMgAAAAAAAAAAgAAAAAAAAAOAAAAAAAAAAB6uqq4GCWcMVyc8tSHF8J+ubM9cpTLxyeDSPbuXY5vnQAAAAAAAAAOAAAAAAAAAABYL8gKk7ey5QIXgMzPAbFhBTLM1P1UA7WC0o1FWaNCNgAAAAA='

const inflationResult = 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAAJAAAAAAAAAAIAAAAACNQTqwpRdbEoAn+tdRR4PCv8hj0vG/SrFkpQQkbWaYkAAKhd+Kl1IAAAAADs3GnuWZXu1qpB+qhI/62WqM4dZ4A1pBgWqEOQJARFlAAACKrsJNw2AAAAAA=='

//Soroban fee bump tx; result encoded as TransactionResultPair
const feeBumpTx = 'AAAABQAAAAAbBOmXthCMLfKu9qv2XJOJAqw8aaSOYH/p1f8hBZbiFQAAAAAF9eEAAAAAAgAAAACN1/a47ezA7IwzBnh4bCGX6KRoLA7HrM12AAdg9gyHkQL68IAAAADJAAAADgAAAAAAAAAAAAAAAQAAAAAAAAAYAAAAAgAAAcwAYXNtAQAAAAEeBWABfgF+YAN+fn4BfmAEfn5+fgF+YAJ+fgF+YAAAAhkEAWMBXwAAAWwBXwABAWwBNwACAWwBOAADAwMCAAQFAwEAEAYRAn8AQYCAwAALfwBBgIDAAAsHMQUGbWVtb3J5AgAFd3JpdGUABAFfAAUKX19kYXRhX2VuZAMAC19faGVhcF9iYXNlAwEKVQJPAQF+IABC/wGDQsgAUgRAAAsgABAAIgEgAEIAEAEaIAFCAEKEgICAgMD0B0KEgICAgMD0BxACGkKEgICAgMD0B0KEgICAgMD0BxADGiABCwMAAQsASw5jb250cmFjdHNwZWN2MAAAAAAAAAAAAAAABXdyaXRlAAAAAAAAAQAAAAAAAAAJeGRyX2J5dGVzAAAAAAAADgAAAAEAAAPuAAAAIAAeEWNvbnRyYWN0ZW52bWV0YXYwAAAAAAAAABQAAAAAAHMOY29udHJhY3RtZXRhdjAAAAAAAAAABXJzdmVyAAAAAAAABjEuNzQuMAAAAAAAAAAAAAhyc3Nka3ZlcgAAADMyMC4wLjAtcmMyIzdjMTU0YjRmZTZhMzdkN2NhNzE3NzM0MmRlZGI2OWYzMTA4MDk1ZWYAAAAAAAAAAAEAAAAAAAAAAAAAAAEAAAAHS5MWchSHKB2CAeHGBEVEQA8SAlNIeXHjOesjpGVRaTUAHoSAAAAH0AAAB9AAAAAAAhYOwAAAAAH2DIeRAAAAQIjIHRoBxTX1HogBnlSlviM6V4sXqasZeyOtIP+GT5jXaB5QD0BaBRpr9qUfncgFZA0cgsHZHCyDbvkjp6KWewcAAAAAAAAAAQWW4hUAAABA0umhKAOKnjO8FE3ZpbiI71aNL38+liKqMmYwwGPhU2la7RltbKJlmdvVM1dIO5FbA3Pb/a5fErjXKir85+SIDg=='
const feeBumpResult = '8lEhP/1ufjnr0z/7KOCur5TRo+4MgcEXGGMuo4qSjJ0AAAAAAhYPiAAAAAEoGaDUDXivYXx3SKOtF5RMvN/BXuyr6Yx5oIZmLyCGrQAAAAACFg8kAAAAAAAAAAEAAAAAAAAAGAAAAADcdEqe+yEDI1k9Nwi8aay1wbzRFOrB5AjJru5bkMccmAAAAAAAAAAA'

const network = Networks.PUBLIC
const anyMeta = 'AAAAAA==' //parseTxDetails only checks meta presence

describe('parseTxResult', () => {
    test('decodes successful transaction result', () => {
        const res = parseTxResult(circularResult)
        expect(res.successful).toBe(true)
        expect(res.feeCharged).toBe('100')
        expect(res.opResults).toHaveLength(1)
    })

    test('unwraps fee bump inner results and accepts TransactionResultPair', () => {
        const res = parseTxResult(feeBumpResult)
        expect(res.successful).toBe(true)
        expect(res.feeCharged).toBe('35000200')
        expect(res.opResults).toHaveLength(1)
        expect(res.opResults[0].tr.type).toBe('invokeHostFunction')
    })
})

describe('buildFeeChargedEffect', () => {
    test('charges the fee bump fee source', () => {
        const tx = TransactionBuilder.fromXdr(feeBumpTx, network)
        expect(buildFeeChargedEffect(tx, '35000200')).toEqual({
            type: 'feeCharged',
            source: 'GANQJ2MXWYIIYLPSV33KX5S4SOEQFLB4NGSI4YD75HK76IIFS3RBKDUJ',
            asset: 'XLM',
            bid: '100000000',
            charged: '35000200',
            bump: true
        })
    })

    test('charges the transaction source for regular transactions', () => {
        const tx = TransactionBuilder.fromXdr(circularTx, network)
        expect(buildFeeChargedEffect(tx, '100')).toEqual({
            type: 'feeCharged',
            source: tx.source,
            asset: 'XLM',
            bid: '100',
            charged: '100'
        })
    })
})

describe('operation result helpers', () => {
    const crossOps = parseTxResult(crossResult).opResults

    test('circular arbitrage amounts', () => {
        const [opResult] = parseTxResult(circularResult).opResults
        expect(retrievePathPaymentAmounts(opResult)).toEqual({sent: '541462388', received: '542722000'})
    })

    test('path payment amounts through offers and pools', () => {
        expect(retrievePathPaymentAmounts(crossOps[7])).toEqual({sent: '891000000', received: '900000000'})
        expect(retrievePathPaymentAmounts(crossOps[8])).toEqual({sent: '100000000', received: '90661089'})
        expect(retrievePathPaymentAmounts(crossOps[4])).toBeNull()
        expect(retrievePathPaymentAmounts(undefined)).toBeNull()
    })

    test('claim atoms of order book and liquidity pool trades', () => {
        expect(retrieveClaimAtoms(crossOps[4])).toEqual([{offer: '14834', seller: issuer}])
        expect(retrieveClaimAtoms(crossOps[7])).toEqual([{offer: '14834', seller: issuer}, {offer: '14835', seller: issuer}])
        expect(retrieveClaimAtoms(crossOps[8])).toEqual([{pool}])
        expect(retrieveClaimAtoms(crossOps[2])).toEqual([])
    })

    test('claim atoms of legacy v0 offers', () => {
        const [opResult] = parseTxResult(circularResult).opResults
        const atoms = retrieveClaimAtoms(opResult)
        expect(atoms.map(a => a.offer)).toEqual(['21648355', '21637634', '21654802'])
        expect(atoms[0].seller).toBe('GAC2WH4XGSJHZWR5AZGVATWCDRXU6MO2DNLR7UVOXHEPEPP4QCJV6PKZ')
    })

    test('claimable balance id', () => {
        const [opResult] = parseTxResult(claimableBalanceResult).opResults
        expect(retrieveClaimableBalanceId(opResult)).toBe('BAAHVOVKXAMCLHBRLSOPFVEHC7BH5ONTHVZJJS6HE6BUR5XOLWHG7HJGBY')
        expect(retrieveClaimableBalanceId(crossOps[0])).toBeUndefined()
    })

    test('inflation payouts', () => {
        const opResult = parseTxResult(inflationResult).opResults[0]
        expect(retrieveInflationPayouts(opResult)).toEqual([
            'GAENIE5LBJIXLMJIAJ7225IUPA6CX7EGHUXRX5FLCZFFAQSG2ZUYSWFK',
            'GDWNY2POLGK65VVKIH5KQSH7VWLKRTQ5M6ADLJAYC2UEHEBEARCZJWWI'
        ])
    })
})

describe('parseTxDetails', () => {
    test('normalizes operations without server effects', () => {
        const parsed = parseTxDetails({network, txEnvelope: circularTx, result: circularResult, meta: anyMeta, context: {}})
        expect(parsed.successful).toBe(true)
        expect(parsed.isEphemeral).toBe(false)
        expect(parsed.effectsLoaded).toBeUndefined()
        expect(parsed.effects).toEqual([buildFeeChargedEffect(parsed.tx, '100')])
        const [op] = parsed.operations
        expect(op.operation.source).toBe(parsed.tx.source)
        expect(op.operation.effects).toEqual([])
        expect(op.operation.result.tr.type).toBe('pathPaymentStrictReceive')
        expect(op.tx).toBe(parsed)
    })

    test('parses fee bump transactions', () => {
        const parsed = parseTxDetails({network, txEnvelope: feeBumpTx, result: feeBumpResult, meta: anyMeta, context: {}})
        expect(parsed.successful).toBe(true)
        expect(parsed.effects[0].bump).toBe(true)
        expect(parsed.operations[0].operation.source).toBe(parsed.tx.innerTransaction.source)
    })

    test('ephemeral transactions have no result or effects', () => {
        const parsed = parseTxDetails({network, txEnvelope: circularTx, context: {}})
        expect(parsed.isEphemeral).toBe(true)
        expect(parsed.successful).toBeUndefined()
        expect(parsed.effects).toBeUndefined()
        expect(parsed.operations[0].operation.effects).toEqual([])
    })

    test('applies server effects', () => {
        const opEffects = [{type: 'accountCredited', source: 'GAWQMXTNVW75NNPHSM7B3BHWTAPJUJMGLPBIMGL5RULAKQZAIKSB7A4O', asset: 'XLM', amount: '1259612'}]
        const txEffects = [{type: 'feeCharged', source: 'GAWQMXTNVW75NNPHSM7B3BHWTAPJUJMGLPBIMGL5RULAKQZAIKSB7A4O', asset: 'XLM', bid: '100', charged: '100'}]
        const parsed = parseTxDetails({
            network,
            txEnvelope: circularTx,
            result: circularResult,
            meta: anyMeta,
            effects: {tx: txEffects, operations: [opEffects]},
            context: {}
        })
        expect(parsed.effectsLoaded).toBe(true)
        expect(parsed.effects).toBe(txEffects)
        expect(parsed.operations[0].operation.effects).toBe(opEffects)
        //effects are attached to the SDK operation objects shared with the parsed transaction
        expect(parsed.tx.operations[0].effects).toBe(opEffects)
    })

    test('marks effects unavailable when the server failed to parse them', () => {
        const parsed = parseTxDetails({network, txEnvelope: circularTx, result: circularResult, meta: anyMeta, context: {}})
        applyTxEffects(parsed, null)
        expect(parsed.effectsLoaded).toBe(true)
        expect(parsed.effectsUnavailable).toBe(true)
        expect(parsed.operations[0].operation.effects).toEqual([])
    })

    test('filters operations crossing an offer using the tx result', () => {
        const parsed = parseTxDetails({network, txEnvelope: crossTx, result: crossResult, meta: anyMeta, context: {offer: ['14834']}})
        expect(parsed.operations.map(op => op.order)).toEqual([4, 7])
    })

    test('filters operations related to a liquidity pool in either id format', () => {
        for (const id of [pool, poolHex]) {
            const parsed = parseTxDetails({network, txEnvelope: crossTx, result: crossResult, meta: anyMeta, context: {pool: [id]}})
            const orders = parsed.operations.map(op => op.order)
            expect(orders).toContain(6)
            expect(orders).toContain(8)
            expect(orders).not.toContain(4)
        }
    })
})
