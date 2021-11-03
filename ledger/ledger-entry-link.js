import React from 'react'
import PropTypes from 'prop-types'
import {formatExplorerLink} from './ledger-entry-href-formatter'
import {useStellarNetwork} from '../state/stellar-network-hooks'

function LedgerEntryLink({type, id, children}) {
    useStellarNetwork()
    return <a href={formatExplorerLink(type, id)} target="_blank">{children || id}</a>
}

export function TxLink({tx, children}) {
    return React.createElement(LedgerEntryLink, {type: 'tx', id: tx, children})
}

TxLink.propTypes = {
    tx: PropTypes.string.isRequired,
    children: PropTypes.any
}

export function OpLink({op, children}) {
    return React.createElement(LedgerEntryLink, {type: 'op', id: op, children})
}

OpLink.propTypes = {
    op: PropTypes.string.isRequired,
    children: PropTypes.any
}

export function LedgerLink({sequence, children}) {
    return React.createElement(LedgerEntryLink, {type: 'ledger', id: sequence, children})
}

LedgerLink.propTypes = {
    sequence: PropTypes.number.isRequired,
    children: PropTypes.any
}

export function OfferLink({offer, children}) {
    return React.createElement(LedgerEntryLink, {type: 'offer', id: offer, children})
}

OfferLink.propTypes = {
    offer: PropTypes.string.isRequired,
    children: PropTypes.any
}