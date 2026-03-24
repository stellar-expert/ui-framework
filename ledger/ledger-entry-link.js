import React from 'react'
import PropTypes from 'prop-types'
import {formatExplorerLink} from './ledger-entry-href-formatter'
import {useStellarNetwork} from '../state/stellar-network-hooks'

function LedgerEntryLink({type, id, network, children}) {
    const globallySetNetwork = useStellarNetwork()
    return <a href={formatExplorerLink(type, id, network || globallySetNetwork)} target="_blank">{children || id}</a>
}

/**
 * Link to a transaction on StellarExpert
 * @param {Object} props
 * @param {string} props.tx - Transaction hash
 * @param {string} [props.network] - Stellar network override
 * @param {*} [props.children] - Custom link content (defaults to the tx hash)
 */
export const TxLink = React.memo(function TxLink({tx, network, children}) {
    return React.createElement(LedgerEntryLink, {type: 'tx', id: tx, network, children})
})

TxLink.propTypes = {
    tx: PropTypes.string.isRequired,
    network: PropTypes.string,
    children: PropTypes.any
}

/**
 * Link to an operation on StellarExpert
 * @param {Object} props
 * @param {string} props.op - Operation ID
 * @param {string} [props.network] - Stellar network override
 * @param {*} [props.children] - Custom link content
 */
export const OpLink = React.memo(function OpLink({op, network, children}) {
    return React.createElement(LedgerEntryLink, {type: 'op', id: op, network, children})
})

OpLink.propTypes = {
    op: PropTypes.string.isRequired,
    network: PropTypes.string,
    children: PropTypes.any
}

/**
 * Link to a ledger on StellarExpert
 * @param {Object} props
 * @param {number} props.sequence - Ledger sequence number
 * @param {string} [props.network] - Stellar network override
 * @param {*} [props.children] - Custom link content
 */
export const LedgerLink = React.memo(function LedgerLink({sequence, network, children}) {
    return React.createElement(LedgerEntryLink, {type: 'ledger', id: sequence, network, children})
})

LedgerLink.propTypes = {
    sequence: PropTypes.number.isRequired,
    network: PropTypes.string,
    children: PropTypes.any
}

/**
 * Link to a DEX offer on StellarExpert
 * @param {Object} props
 * @param {string} props.offer - Offer ID
 * @param {string} [props.network] - Stellar network override
 * @param {*} [props.children] - Custom link content
 */
export const OfferLink = React.memo(function OfferLink({offer, network, children}) {
    return React.createElement(LedgerEntryLink, {type: 'offer', id: offer, network, children})
})

OfferLink.propTypes = {
    offer: PropTypes.string.isRequired,
    network: PropTypes.string,
    children: PropTypes.any
}

/**
 * Link to a liquidity pool on StellarExpert
 * @param {Object} props
 * @param {string} props.pool - Pool ID
 * @param {string} [props.network] - Stellar network override
 * @param {*} [props.children] - Custom link content
 */
export const PoolLink = React.memo(function PoolLink({pool, network, children}) {
    return React.createElement(LedgerEntryLink, {type: 'pool', id: pool, network, children})
})

PoolLink.propTypes = {
    pool: PropTypes.string.isRequired,
    network: PropTypes.string,
    children: PropTypes.any
}