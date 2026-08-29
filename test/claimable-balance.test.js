import {Keypair, xdr} from '@stellar/stellar-sdk'
import {xdrParseClaimant} from '../claimable-balance/claim-conditions-xdr-parser.js'
import {getClaimableBalanceClaimStatus} from '../claimable-balance/claimable-balance-overlap.js'

const past = '2020-01-01T00:00:00Z'
const soon = '2030-01-01T00:00:00Z'
const farFuture = '2090-01-01T00:00:00Z'

const status = predicate => getClaimableBalanceClaimStatus({predicate})

describe('getClaimableBalanceClaimStatus', () => {
    test('unconditional is always available', () => {
        expect(status({unconditional: true})).toBe('available')
    })

    test('absolute time bounds', () => {
        expect(status({abs_before: soon})).toBe('available')
        expect(status({abs_before: past})).toBe('expired')
    })

    test('timestamps beyond 2038 are not truncated to int32', () => {
        //parseTime used `| 0`, which wrapped any post-2038 epoch second into a negative number
        expect(status({abs_before: farFuture})).toBe('available')
    })

    test('single-element and/or predicates resolve instead of throwing', () => {
        //`and`/`or` used to hand back a raw array for a one-element operand, so getStatus() was undefined
        expect(status({and: [{unconditional: true}]})).toBe('available')
        expect(status({or: [{unconditional: true}]})).toBe('available')
        expect(status({and: [{abs_before: past}]})).toBe('expired')
        expect(status({or: [{abs_before: soon}]})).toBe('available')
    })

    test('multi-element or unions the operands', () => {
        expect(status({or: [{abs_before: past}, {abs_before: soon}]})).toBe('available')
        expect(status({or: [{abs_before: past}, {abs_before: past}]})).toBe('expired')
    })

    test('multi-element and intersects the operands', () => {
        expect(status({and: [{abs_before: soon}, {unconditional: true}]})).toBe('available')
        expect(status({and: [{abs_before: past}, {abs_before: soon}]})).toBe('expired')
    })

    test('not inverts the interval', () => {
        expect(status({not: {abs_before: past}})).toBe('available')
        expect(status({not: {abs_before: soon}})).toBe('pending')
    })

    test('rejects an unrecognized predicate', () => {
        expect(() => status({bogus: true})).toThrow(/Failed to parse claimable balance predicate/)
    })
})

describe('xdrParseClaimant', () => {
    const kp = Keypair.random()
    const destination = xdr.PublicKey.publicKeyTypeEd25519(kp.rawPublicKey())
    const P = xdr.ClaimPredicate

    test('decodes an ed25519 destination from XDR', () => {
        const parsed = xdrParseClaimant({destination, predicate: P.claimPredicateUnconditional()})
        expect(parsed.destination).toBe(kp.publicKey())
        expect(parsed.predicate).toContain('unconditional')
    })

    test('passes an already-encoded destination through', () => {
        const parsed = xdrParseClaimant({destination: kp.publicKey(), predicate: P.claimPredicateUnconditional()})
        expect(parsed.destination).toBe(kp.publicKey())
    })

    test('decodes a muxed destination to its base address', () => {
        const muxed = xdr.MuxedAccount.keyTypeMuxedEd25519(
            new xdr.MuxedAccountMed25519({id: 7n, ed25519: kp.rawPublicKey()}))
        const parsed = xdrParseClaimant({destination: muxed, predicate: P.claimPredicateUnconditional()})
        expect(parsed.destination).toBe(kp.publicKey())
    })

    test('formats absolute time predicates', () => {
        const parsed = xdrParseClaimant({destination, predicate: P.claimPredicateBeforeAbsoluteTime(1893456000n)})
        expect(parsed.predicate).toContain('before 2030-01-01 00:00:00')
    })

    test('formats relative time predicates', () => {
        expect(xdrParseClaimant({destination, predicate: P.claimPredicateBeforeRelativeTime(3600n)}).predicate)
            .toContain('before 1 hour from now')
        expect(xdrParseClaimant({destination, predicate: P.claimPredicateBeforeRelativeTime(60n)}).predicate)
            .toContain('before 1 minute from now')
    })

    test('negates a time predicate wrapped in not', () => {
        const parsed = xdrParseClaimant({
            destination,
            predicate: P.claimPredicateNot(P.claimPredicateBeforeAbsoluteTime(1893456000n))
        })
        expect(parsed.predicate).toContain('after 2030-01-01 00:00:00')
    })

    test('joins and/or operands', () => {
        const and = xdrParseClaimant({
            destination,
            predicate: P.claimPredicateAnd([
                P.claimPredicateBeforeAbsoluteTime(1893456000n),
                P.claimPredicateBeforeRelativeTime(60n)])
        })
        expect(and.predicate).toContain(' and ')
        const or = xdrParseClaimant({
            destination,
            predicate: P.claimPredicateOr([P.claimPredicateUnconditional(), P.claimPredicateBeforeRelativeTime(60n)])
        })
        expect(or.predicate).toContain(' or ')
    })

    test('rejects an unknown predicate arm', () => {
        expect(() => xdrParseClaimant({destination, predicate: {type: 'nope'}}))
            .toThrow(/Unknown claim condition predicate/)
    })
})
