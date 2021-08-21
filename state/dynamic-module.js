import React from 'react'
import PropTypes from 'prop-types'
import {useDependantState} from './state-hooks'

const loadedModules = new Map()

export function DynamicModule({load, moduleKey, ...otherProps}) {
    const [{module, error}, setState] = useDependantState(() => {
        const module = loadedModules.get(moduleKey || load)
        if (module) return {module, error: null}

        load()
            .then(module => {
                if (module.__esModule) {
                    module = module.default
                }
                loadedModules.set(moduleKey || load, module)
                setState({module, error: null})
            })
            .catch(error => {
                console.error(error)
                setState({module: null, error})
            })
        return {module: null, error: null}
    }, [moduleKey || load])
    if (!module) return <div className="loader"/>
    return React.createElement(module, otherProps)
}

DynamicModule.propTypes = {
    load: PropTypes.func.isRequired
}