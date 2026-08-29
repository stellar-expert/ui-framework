import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {xdr} from '@stellar/stellar-sdk'
import InvocationInfoView from '../contract/invocation-info-view'

//`contract` is omitted so the component stays on its static path and does not reach the contract-source API hook
const render = props => renderToStaticMarkup(React.createElement(InvocationInfoView, props))
const text = props => render(props)
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#123;/g, '{')
    .replace(/&#125;/g, '}')

describe('InvocationInfoView argument unwrapping', () => {
    test('unwraps a base64 scvVec into its elements', () => {
        //args used to be unwrapped via the removed `_arm`/`_value` internals
        const args = xdr.ScVal.scvVec([xdr.ScVal.scvU32(1), xdr.ScVal.scvSymbol('x')]).toXdr('base64')
        expect(text({func: 'transfer', args})).toContain('transfer(1u32, "x"sym)')
    })

    test('wraps a non-vec scalar into a single argument', () => {
        const args = xdr.ScVal.scvU32(7).toXdr('base64')
        expect(text({func: 'bump', args})).toContain('bump(7u32)')
    })

    test('handles an empty argument vector', () => {
        const args = xdr.ScVal.scvVec([]).toXdr('base64')
        expect(text({func: 'decimals', args})).toContain('decimals()')
    })

    test('accepts an already-parsed argument array', () => {
        expect(text({func: 'balance', args: [xdr.ScVal.scvU32(3)]})).toContain('balance(3u32)')
    })

    test('renders the invocation result when present', () => {
        const out = text({func: 'balance', args: [], result: xdr.ScVal.scvU32(9)})
        expect(out).toContain('9u32')
    })
})
