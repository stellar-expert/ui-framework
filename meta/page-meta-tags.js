import {useEffect} from 'react'
import isEqual from 'react-fast-compare'

const {origin} = window.location
const domain = origin.replace(/https?:\/\//, '')

const metaProps = {
    serviceTitle: '',
    description: '',
    facebookImage: '',
    twitterImage: '',
    twitterUsername: ''
}

/**
 * Initialize default meta properties for the application
 * @param {{serviceTitle: String, description: String, facebookImage: String, twitterImage: String, twitterUsername: String}} appMetaProps
 */
export function initMeta(appMetaProps) {
    Object.assign(metaProps, appMetaProps)
}

function formatPageTitle(title) {
    if (!title)
        return metaProps.serviceTitle
    if (title.includes(metaProps.serviceTitle))
        return title
    return `${title} ${metaProps.serviceTitle}`
}

function generateCanonicalLink(params, canonicalUrl) {
    return {
        tag: 'link',
        locator: 'rel',
        tags: [
            {name: 'canonical', content: canonicalUrl, attribute: 'href'}
        ]
    }
}

function generateDescriptionMeta({description}) {
    return {
        locator: 'name',
        tags: [
            {name: 'description', content: description || metaProps.description}
        ]
    }
}

function generateTwitterMeta({description, title, twitterImage}) {
    return {
        locator: 'name',
        tags: [
            {name: 'twitter:card', content: 'summary_large_image'},
            {name: 'twitter:site', content: metaProps.twitterUsername},
            {name: 'twitter:title', content: formatPageTitle(title)},
            {name: 'twitter:description', content: description || metaProps.description},
            {name: 'twitter:image:src', content: twitterImage || metaProps.twitterImage}
        ]
    }
}

function generateOpenGraphMeta({description, title, facebookImage}, canonicalUrl) {
    let tags = [
        {name: 'og:title', content: formatPageTitle(title)},
        {name: 'og:url', content: canonicalUrl},
        {name: 'og:site_name', content: formatPageTitle(metaProps.serviceTitle)},
        {name: 'og:description', content: description || metaProps.description},
        {name: 'og:type', content: 'website'}
    ]
    if (facebookImage) {
        tags.push({name: 'og:image', content: facebookImage})
    } else {
        tags.push({name: 'og:image', content: metaProps.facebookImage})
        /*tags = tags.concat([
            {name: 'og:image', content: metaProps.facebookImage},
            {name: 'og:image:width', content: 1200},
            {name: 'og:image:height', content: 630}])*/
    }
    return {
        locator: 'property',
        tags
    }
}

function generateItemPropSchema({description, title, image}) {
    return {
        locator: 'itemprop',
        tags: [
            {name: 'name', content: title},
            {name: 'description', content: description || metaProps.description},
            {name: 'image', content: image || metaProps.facebookImage}
        ]
    }
}

function generateLdJsonSchema({title}) {
    return {
        tag: 'script',
        locator: 'type',
        tags: [
            {
                name: 'application/ld+json',
                content: JSON.stringify({
                    '@context': 'http://schema.org',
                    '@type': 'WebSite',
                    'name': domain,
                    'alternateName': title,
                    'url': origin
                })
            }
        ]
    }
}

/**
 * @param {MetaTagReplacement} replacement
 */
function replaceMetaTags(replacement) {
    const {tag, tags, locator} = replacement
    const selector = tag || 'meta'
    tags.forEach(tagSettings => {
        let tag = document.querySelector(`${selector}[${locator}="${tagSettings.name}"]`)
        if (!tag) {
            tag = createTag(selector)
            tag.setAttribute(locator, tagSettings.name)
        }
        if (selector === 'meta') {
            tag.content = tagSettings.content
        } else if (tagSettings.attribute) {
            tag[tagSettings.attribute] = tagSettings.content
        } else {
            tag.innerText = tagSettings.content
        }
    })
}

function createTag(tagName, props) {
    let tag = document.createElement(tagName)
    for (let key in props) {
        tag[key] = props[key]
    }
    document.head.appendChild(tag)
    return tag
}

function removeTag(selector) {
    let tag = document.querySelector(selector)
    if (tag) {
        tag.parentElement.removeChild(tag)
    }
}

let pageMeta = {}

const tagReplacerPipeline = [generateCanonicalLink, generateDescriptionMeta, generateOpenGraphMeta, generateTwitterMeta, generateLdJsonSchema] // generateItemPropSchema

/**
 * Update page metadata tags
 * @param {PageMeta} meta - Page metadata
 */
export function setPageMetadata(meta) {
    if (isEqual(pageMeta, meta))
        return
    const canonicalUrl = origin + location.pathname// + location.search
    document.title = formatPageTitle(meta.title)
    for (const replacer of tagReplacerPipeline) {
        replaceMetaTags(replacer(meta, canonicalUrl))
    }
    if (meta.customMeta) {
        replaceMetaTags(meta.customMeta)
    }
    pageMeta = meta
}

/**
 * Reset page metadata tags to their default values
 * @param {PageMeta} meta - Page metadata
 */
export function resetPageMetadata(meta) {
    setPageMetadata({
        title: metaProps.serviceTitle,
        description: metaProps.description,
        twitterImage: metaProps.twitterImage,
        facebookImage: metaProps.facebookImage
    })
    //TODO: add logic to cleanup custom page meta tags on page unload
}

/*export function setPageNoIndex(noIndex) {
    if (!noIndex) {
        removeTag('meta[name=robots]')
    } else {
        replaceMetaTags({
            locator: 'name',
            tags: [
                {name: 'robots', content: 'noindex,nofollow'}
            ]
        })
    }
}*/

/**
 * React hook for setting page metadata
 * @param {PageMeta} meta - Page metadata
 * @param {*[]} dependencies
 */
export function usePageMetadata(meta, dependencies = []) {
    useEffect(() => {
        setPageMetadata(meta)
        return () => resetPageMetadata(meta)
    }, [JSON.stringify(meta), ...dependencies])
}

/**
 * @typedef {Object} PageMeta
 * @property {String} title - Page title
 * @property {String} description - Contents description
 * @property {String} [twitterImage] - Twitter image url
 * @property {String} [facebookImage] - Facebook image url
 * @property {MetaTagReplacement} [customMeta] - Custom metadata tags
 */

/**
 * @typedef {Object} MetaTagReplacement
 * @property {String} [tag] - Tag name to search for ("meta" by default)
 * @property {String} locator - Tag attribute to match
 * @property {{name: String, content: String, [attribute]: String}[]} tags - Tag properties to set
 */