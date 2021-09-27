import {useState, useEffect, useRef} from 'react'
import isEqual from 'react-fast-compare'

function ensureDependencies(dependencies) {
    if (!(dependencies instanceof Array))
        throw new Error('Parameter dependencies is required for useDependantState hook')
}

/**
 * React hook that automatically re-inits state when one of the dependencies changed
 * @param {Function|any} stateInitializer
 * @param {Array} dependencies
 * @param {Function} [finalizer]
 * @returns {[Object, Function]}
 */
export function useDependantState(stateInitializer, dependencies, finalizer) {
    //ensureDependencies(dependencies)
    const [state, updateState] = useState(function () {
        return typeof stateInitializer === 'function' ? stateInitializer(dependencies) : stateInitializer
    })
    //pin dependencies object to invoke effect update only if dependencies changed
    const pinnedDeps = useRef(dependencies)
    let dependenciesChanged = !isEqual(dependencies, pinnedDeps.current)
    //check that dependencies really changed
    if (dependenciesChanged) {
        pinnedDeps.current = dependencies
    }

    //effect invokes the initializer each time dependencies changed
    useEffect(function () {
        //check that dependencies really changed
        if (dependenciesChanged) {
            //re-initialize state when any of the dependencies changed
            updateState(typeof stateInitializer === 'function' ? stateInitializer(dependencies, state) : stateInitializer)
        }
        return finalizer || undefined
    }, pinnedDeps.current)

    return [state, function (newState) {
        //use deep compare - as React used to in good old times
        updateState(current => {
            if (typeof newState === 'function') {
                newState = newState(current)
            }
            if (isEqual(current, newState)) return current
            return newState
        })
    }]
}

/**
 * Simple force update hook.
 * @return {Function}
 */
export function useForceUpdate() {
    const [, updateNonce] = useState(0)
    return function () {
        updateNonce(nonce => nonce + 1)
    }
}

/**
 * React hook that automatically reacts on dependency changes using deep comparison
 * @param {Function} effect
 * @param {Array} dependencies
 */
export function useDeepEffect(effect, dependencies) {
    ensureDependencies(dependencies)
    //pin dependencies object to invoke effect update only if dependencies changed
    const pinnedDeps = useRef([])
    //check that dependencies really changed
    if (!isEqual(dependencies, pinnedDeps.current)) {
        pinnedDeps.current = dependencies
    }
    //effect invokes the initializer each time dependencies changed
    useEffect(effect, pinnedDeps.current)
}