import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {useDependantState} from '../state/state-hooks'
import {navigation} from '../state/navigation'
import './tabs.scss'

export function Tabs({tabs, selectedTab, queryParam, className, onChange, children}) {
    const [internallySelectedTab, setSelectedTab] = useDependantState(() => {
        //return the props-derived tab name if available
        if (selectedTab) return selectedTab
        //try to get from query string
        if (queryParam) {
            const tab = navigation.query[queryParam]
            if (findTabByName(tab)) return tab
        }
        //return first tab
        const firstTab = tabs[0]
        return firstTab ? firstTab.name : null
    }, [selectedTab])

    useEffect(() => {
        if (!queryParam) return
        const stopListeningQueryChanges = navigation.listen(({query}) => selectTab(query[queryParam]))
        return () => {
            stopListeningQueryChanges && stopListeningQueryChanges()
            setSelectedTab(null)
        }
    })


    function findTabByName(tabName) {
        return tabs.find(t => t.name === tabName)
    }

    function selectTab(tabName) {
        const tab = findTabByName(tabName)
        if (!tab) {
            if (selectedTab === undefined) {
                setSelectedTab(null)
            }
            return
        }

        if (internallySelectedTab === tabName || selectedTab === tabName) return

        if (onChange) {
            onChange(tabName, this)
        }
        if (queryParam) {
            navigation.updateQuery({[queryParam]: tab.isDefault ? undefined : tabName})
        }
        if (selectedTab === undefined) {
            setSelectedTab(tabName)
        }
    }

    const s = selectedTab || internallySelectedTab,
        tabToRender = tabs.find(({name}) => name === s) || tabs[0]

    return <div className={`tabs${className ? ' ' + className : ''}`}>
        <div className="tabs-header">
            <div>
                {tabs.map(({name, title}) => <a href="#" key={name} onClick={() => selectTab(name)}
                                                className={cn('tabs-item', {selected: s === name})}>
                    {title || name}</a>)}
            </div>
            {children}
        </div>
        <div className="tabs-body">
            {tabToRender.render()}
        </div>
    </div>
}

Tabs.propTypes = {
    tabs: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        render: PropTypes.func.isRequired,
        title: PropTypes.string,
        isDefault: PropTypes.bool
    })).isRequired,
    className: PropTypes.string,
    onChange: PropTypes.func,
    selectedTab: PropTypes.string,
    queryParam: PropTypes.string
}