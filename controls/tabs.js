import React, {useEffect} from 'react'
import cn from 'classnames'
import {navigation} from '@stellar-expert/navigation'
import {useDependantState} from '../state/state-hooks'
import './tabs.scss'

/**
 * Tabs control
 * @param {TabDescriptor[]} tabs - Tabs list
 * @param {String} selectedTab? - Currently selected tab
 * @param {Function} onChange? - Handler for tabChanged event
 * @param {String} queryParam? - Associated query param name
 * @param {String} className? - Optional CSS class name
 * @param {Boolean} right? - Inline tabs to the right within the header
 * @param {*} children? - Additional content to render in the tabs header
 * @constructor
 */
export function Tabs({tabs, selectedTab, queryParam, className, onChange, right, children}) {
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
        const stopListeningQueryChanges = navigation.listen(({query}) => {
            const tab = query[queryParam] || (tabs.find(t => t.isDefault) || tabs[0])?.name
            selectTab(tab)
        })
        return () => {
            stopListeningQueryChanges && stopListeningQueryChanges()
        }
    }, [tabs, queryParam])

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
        if (selectedTab === undefined) {
            setSelectedTab(tabName)
        }
        if (queryParam) {
            navigation.updateQuery({[queryParam]: tab.isDefault ? undefined : tabName})
        }
    }

    const s = selectedTab || internallySelectedTab
    const tabToRender = tabs.find(({name}) => name === s) || tabs[0]

    return <div className={cn('tabs', className, {'inline-right': right})}>
        <div className="tabs-header">
            <div>
                {tabs.map(({name, title}) => <a href="#" key={name} onClick={() => selectTab(name)}
                                                className={cn('tabs-item', 'condensed', {selected: s === name})}>
                    <span className="tabs-item-text">{title || name}</span></a>)}
            </div>
            {children}
        </div>
        <hr className="flare"/>
        {!!tabToRender.render && <div className="tabs-body">
            {tabToRender.render()}
        </div>}
    </div>
}

/**
 * @typedef {{}} TabDescriptor
 * @property {String} name - Unique table name
 * @property {String} title? - Optional display name (if differs from tab name)
 * @property {Function} render? - Render callback
 * @property {Boolean} isDefault? - Whether this tab should be displayed by default
 */
