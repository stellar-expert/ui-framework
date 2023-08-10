import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import hljs from 'highlight.js/lib/core'
import jsLang from 'highlight.js/lib/languages/javascript'
import jsonLang from 'highlight.js/lib/languages/json'
import htmlLang from 'highlight.js/lib/languages/xml'
import plaintextLang from 'highlight.js/lib/languages/plaintext'
import tomlLang from 'highlight.js/lib/languages/ini'
import './code-block.scss'

hljs.registerLanguage('js', jsLang)
hljs.registerLanguage('json', jsonLang)
hljs.registerLanguage('html', htmlLang)
hljs.registerLanguage('plain', plaintextLang)
hljs.registerLanguage('toml', tomlLang)

export const CodeBlock = React.memo(function CodeBlock({children, lang, className, style}) {
    if (lang) {
        lang = lang.split(',')
    }
    const languageFilter = lang || ['js', 'json']
    const highlighted = hljs.highlightAuto(children, languageFilter)
    return <pre dangerouslySetInnerHTML={{__html: highlighted.value}} className={cn('hljs', className)} style={style}/>
})

CodeBlock.propTypes = {
    children: PropTypes.string.isRequired,
    lang: PropTypes.oneOf(['js', 'json', 'html', 'plain', 'toml']),
    className: PropTypes.string,
    style: PropTypes.object
}