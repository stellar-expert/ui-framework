import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {withErrorBoundary} from '../errors/error-boundary'

const loadedModules = new Map()

export const DynamicModule = withErrorBoundary(
    /**
     * Dynamically loadable module
     * @param {Function} load - Dynamic load function, e.g. ()=>import('./dynamic_module_import')
     * @param {String} module - Module unique name for aching purpose
     * @param {*} [otherProps]
     * @constructor
     */
    function DynamicModule({load, module, ...otherProps}) {
        const [error, setError] = useState(undefined)
        const key = module || load

        useEffect(() => {
            if (loadedModules.get(key))
                return //skip if module is already loaded
            load()
                .then(dynamicModule => {
                    //use default export for ES modules or top-level export for CJS
                    if (dynamicModule.__esModule) {
                        dynamicModule = dynamicModule.default
                    }
                    //add to cache
                    loadedModules.set(key, dynamicModule)
                    setError(null)
                })
                .catch(error => {
                    error.message = 'Failed to load module. ' + error.message
                    setError(error)
                })
        }, [module || load])
        if (error)
            throw error
        const resolvedModule = loadedModules.get(key)
        if (!resolvedModule)
            return <div className="loader"/>
        return React.createElement(resolvedModule, otherProps)
    })

DynamicModule.propTypes = {
    load: PropTypes.func.isRequired,
    module: PropTypes.string
}