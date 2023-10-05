import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import hljs from 'highlight.js/lib/core'
import jsLang from 'highlight.js/lib/languages/javascript'
import jsonLang from 'highlight.js/lib/languages/json'
import xmlLang from 'highlight.js/lib/languages/xml'
import plaintextLang from 'highlight.js/lib/languages/plaintext'
import tomlLang from 'highlight.js/lib/languages/ini'
import rustLang from 'highlight.js/lib/languages/rust'
import './code-block.scss'

hljs.registerLanguage('js', jsLang)
hljs.registerLanguage('json', jsonLang)
hljs.registerLanguage('html', xmlLang)
hljs.registerLanguage('xml', xmlLang)
hljs.registerLanguage('plain', plaintextLang)
hljs.registerLanguage('toml', tomlLang)
hljs.registerLanguage('rust', rustLang)

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
    lang: PropTypes.oneOf(['js', 'json', 'html', 'xml', 'toml', 'rust', 'plain']),
    className: PropTypes.string,
    style: PropTypes.object
}