import React from 'react'
import {useTheme} from '../state/theme'

/**
 * Theme toggle button that switches between day (light) and night (dark) themes
 */
export const ThemeSelector = React.memo(function ThemeSelector() {
    const [theme, setTheme] = useTheme()
    return <a href="#" onClick={() => setTheme(current => current === 'day' ? 'night' : 'day')}>
        {theme === 'day' ?
            <><i className="icon icon-night"/> Dark theme</> :
            <><i className="icon icon-day"/> Light theme</>}
    </a>
})