import {useEffect} from 'react'
import isEqual from 'react-fast-compare'

const metaProps = {
    serviceTitle: '',
    description: '',
    image: '',
    imageEndpoint: '',
    origin: '',
    domain: ''
}

setOrigin(window.location.origin)

/**
 * Initialize default meta properties for the application
 * @param {{serviceTitle: String, description: String, origin: String, [image]: String, [imageEndpoint]: String}} appMetaProps
 */
export function initMeta(appMetaProps) {
    const {origin, ...props} = appMetaProps
    Object.assign(metaProps, props)
    if (origin) {
        setOrigin(origin)
    }
}

function setOrigin(origin) {
    metaProps.origin = origin
    metaProps.domain = origin.replace(/https?:\/\//, '')
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

function generateOpenGraphMeta({description, title, image}, canonicalUrl) {
    //imageEndpoint
    return {
        locator: 'property',
        tags: [
            {name: 'og:title', content: formatPageTitle(title)},
            {name: 'og:url', content: canonicalUrl},
            {name: 'og:site_name', content: formatPageTitle(metaProps.serviceTitle)},
            {name: 'og:description', content: description || metaProps.description},
            {name: 'og:type', content: 'website'},
            {name: 'og:image:width', content: 1200},
            {name: 'og:image:height', content: 630},
            {name: 'og:image', content: formatPageImage(image, canonicalUrl)}
        ]
    }
}

function generateItemPropSchema({description, title, image}) {
    return {
        locator: 'itemprop',
        tags: [
            {name: 'name', content: title},
            {name: 'description', content: description || metaProps.description},
            {name: 'image', content: image || metaProps.image}
        ]
    }
}

function generateLdJsonSchema({title, description, image}, canonicalUrl) {
    return {
        tag: 'script',
        locator: 'type',
        tags: [
            {
                name: 'application/ld+json',
                content: JSON.stringify({
                    '@context': 'http://schema.org',
                    '@type': 'WebPage',
                    name: formatPageTitle(title),
                    description: description || metaProps.description,
                    url: canonicalUrl,
                    thumbnailUrl: formatPageImage(image, canonicalUrl),
                    publisher: {
                        '@type': 'ProfilePage',
                        name: metaProps.serviceTitle
                    }
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

function formatCanonicalUrl() {
    return metaProps.origin + window.location.pathname// + location.search
}

function formatPageImage(image, canonicalUrl) {
    if (image)
        return image
    if (metaProps.imageEndpoint)
        return metaProps.imageEndpoint + canonicalUrl.replace(metaProps.origin, '')
    return metaProps.image
}

let pageMeta = {}

const tagReplacerPipeline = [
    generateCanonicalLink,
    generateDescriptionMeta,
    generateOpenGraphMeta,
    generateLdJsonSchema
] // generateItemPropSchema

/**
 * Update page metadata tags
 * @param {PageMeta} meta - Page metadata
 */
function setPageMetadata(meta) {
    if (isEqual(pageMeta, meta))
        return
    //generate canonical URL
    const canonicalUrl = formatCanonicalUrl()
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
function resetPageMetadata(meta) {
    setPageMetadata({
        title: metaProps.serviceTitle,
        description: metaProps.description,
        image: metaProps.image
    })
    //TODO: add logic to cleanup custom page meta tags on page unload
}

/**
 * React hook for setting page metadata
 * @param {PageMeta} meta - Page metadata
 */
export function usePageMetadata(meta) {
    useEffect(() => {
        setPageMetadata(meta)
        return () => resetPageMetadata(meta)
    }, [JSON.stringify(meta), [formatCanonicalUrl()]])
}

export function setPageNoIndex(noIndex) {
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
}

/**
 * @typedef {Object} PageMeta
 * @property {String} title - Page title
 * @property {String} description - Contents description
 * @property {String} [image] - Page image url
 * @property {MetaTagReplacement} [customMeta] - Custom metadata tags
 */

/**
 * @typedef {Object} MetaTagReplacement
 * @property {String} [tag] - Tag name to search for ("meta" by default)
 * @property {String} locator - Tag attribute to match
 * @property {{name: String, content: String, [attribute]: String}[]} tags - Tag properties to set
 */