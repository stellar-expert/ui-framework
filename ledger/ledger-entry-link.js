import React from 'react'
import PropTypes from 'prop-types'
import {formatExplorerLink} from './ledger-entry-href-formatter'
import {useStellarNetwork} from '../state/stellar-network-hooks'

function LedgerEntryLink({type, id, network, children}) {
    const globallySetNetwork = useStellarNetwork()
    return <a href={formatExplorerLink(type, id, network || globallySetNetwork)} target="_blank">{children || id}</a>
}

export function TxLink({tx, network, children}) {
    return React.createElement(LedgerEntryLink, {type: 'tx', id: tx, network, children})
}

TxLink.propTypes = {
    tx: PropTypes.string.isRequired,
    network: PropTypes.string,
    children: PropTypes.any
}

export function OpLink({op, network, children}) {
    return React.createElement(LedgerEntryLink, {type: 'op', id: op, network, children})
}

OpLink.propTypes = {
    op: PropTypes.string.isRequired,
    network: PropTypes.string,
    children: PropTypes.any
}

export function LedgerLink({sequence, network, children}) {
    return React.createElement(LedgerEntryLink, {type: 'ledger', id: sequence, network, children})
}

LedgerLink.propTypes = {
    sequence: PropTypes.number.isRequired,
    network: PropTypes.string,
    children: PropTypes.any
}

export function OfferLink({offer, network, children}) {
    return React.createElement(LedgerEntryLink, {type: 'offer', id: offer, network, children})
}

OfferLink.propTypes = {
    offer: PropTypes.string.isRequired,
    network: PropTypes.string,
    children: PropTypes.any
}