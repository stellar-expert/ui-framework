import React, {createContext, useContext, useEffect, useState} from 'react'

/*
Address poisoning: an attacker generates a vanity address that starts and ends with the same characters as an address
the victim has recently transacted with, and sends a dust payment from it. Shortened addresses look identical in the
history, so the victim may copy the wrong one for the next payment.
Addresses rendered inside a <SimilarAddressesScope> are compared with each other, and those that differ but share
the same leading and trailing characters get a warning.
 */

const prefixLength = 3
const suffixLength = 4

/**
 * Leading and trailing characters of an address that an attacker has to match in order to imitate it
 * @param {string} address - StrKey-encoded address
 * @return {string}
 */
export function getAddressSimilarityKey(address) {
    return address.substring(0, prefixLength) + '…' + address.substring(address.length - suffixLength)
}

/**
 * Find addresses that look alike (share the same leading and trailing characters) but are not the same
 * @param {Iterable<string>} addresses - StrKey-encoded addresses
 * @return {Set<string>} Addresses that can be confused with another address from the list
 */
export function findSimilarAddresses(addresses) {
    const groups = new Map()
    for (const address of addresses) {
        if (typeof address !== 'string')
            continue
        const key = getAddressSimilarityKey(address)
        let group = groups.get(key)
        if (!group) {
            group = new Set()
            groups.set(key, group)
        }
        group.add(address)
    }
    const res = new Set()
    for (const group of groups.values()) {
        if (group.size > 1) {
            for (const address of group) {
                res.add(address)
            }
        }
    }
    return res
}

/**
 * Keeps track of the addresses currently displayed within a scope and notifies listeners when a lookalike address shows up or goes away
 */
export class SimilarAddressesTracker {
    /**
     * @type {Map<string, Map<string, Set<function>>>} - Listeners grouped by similarity key and address
     * @private
     */
    groups = new Map()

    /**
     * Register a displayed address
     * @param {string} address - StrKey-encoded address
     * @param {function} listener - Callback invoked every time a set of the lookalike addresses changes
     * @return {function} Callback that removes the address from the tracker
     */
    track(address, listener) {
        const key = getAddressSimilarityKey(address)
        let group = this.groups.get(key)
        if (!group) {
            group = new Map()
            this.groups.set(key, group)
        }
        let listeners = group.get(address)
        if (!listeners) {
            listeners = new Set()
            group.set(address, listeners)
            notify(group, address)
        }
        listeners.add(listener)
        return () => {
            listeners.delete(listener)
            if (listeners.size || group.get(address) !== listeners)
                return
            group.delete(address)
            if (!group.size) {
                this.groups.delete(key)
            } else {
                notify(group, address)
            }
        }
    }

    /**
     * Check whether some other tracked address looks like the given one
     * @param {string} address - StrKey-encoded address
     * @return {boolean}
     */
    hasSimilar(address) {
        const group = this.groups.get(getAddressSimilarityKey(address))
        if (!group)
            return false
        return group.size > (group.has(address) ? 1 : 0)
    }
}

function notify(group, changedAddress) {
    for (const [address, listeners] of group) {
        if (address === changedAddress)
            continue
        for (const listener of Array.from(listeners)) {
            listener()
        }
    }
}

const SimilarAddressesContext = createContext(null)

/**
 * Addresses rendered by AccountAddress components inside of this container are checked for lookalikes
 * @param {*} children
 * @constructor
 */
export function SimilarAddressesScope({children}) {
    const [tracker] = useState(() => new SimilarAddressesTracker())
    return <SimilarAddressesContext.Provider value={tracker}>{children}</SimilarAddressesContext.Provider>
}

/**
 * Check whether another address that looks like the given one is displayed within the enclosing SimilarAddressesScope
 * @param {string} [address] - StrKey-encoded address
 * @return {boolean} Always false outside of the scope
 */
export function useSimilarAddressWarning(address) {
    const tracker = useContext(SimilarAddressesContext)
    const [similar, setSimilar] = useState(false)
    useEffect(() => {
        if (!tracker || !address) {
            setSimilar(false)
            return
        }
        const update = () => setSimilar(tracker.hasSimilar(address))
        const untrack = tracker.track(address, update)
        update()
        return untrack
    }, [tracker, address])
    return similar
}
