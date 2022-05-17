import toml from 'toml'

const schemaSymbol = 'toml-schema'

const schemas = {
    root: require('./schema/toml-root-schema').default,
    org: require('./schema/toml-org-schema').default,
    principal: require('./schema/toml-principal-schema').default,
    currency: require('./schema/toml-currency-schema').default,
    validator: require('./schema/toml-validator-schema').default
}

function validateField() { //empty stub
    return {}
}

function validateArray() { //empty stub
    return {}
}


class TomlParsingResult {
    constructor(raw, warnings = null) {
        this.raw = raw
        this.data = {}
        if (!warnings) {
            warnings = []
        } else {
            if (!(warnings instanceof Array)) {
                warnings = [warnings]
            }
        }
        this.warnings = warnings || []
    }

    /**
     * Raw TOML data.
     * @type {string}
     */
    raw = null

    /**
     * Parsed data.
     * @type {object}
     */
    data = null

    /**
     * Parsing errors and schema warnings.
     * @type {Array<ValidationResult>}
     */
    warnings = null

    get hasWarnings() {
        return !!this.warnings.length
    }

    /**
     * Record a warning.
     * @param {ValidationResult|Array<ValidationResult>} warning - Warning or array of warnings to add.
     */
    addWarning(warning) {
        if (warning instanceof Array) {
            this.warnings = this.warnings.concat(warning)
        } else {
            this.warnings.push(warning)
        }
    }
}

class TomlSchemaParser {
    constructor(schemaName) {
        if (typeof schemaName !== 'string') throw new Error('Invalid schema name: ' + schemaName)
        this.schema = schemas[schemaName]
    }

    /**
     *
     * @param {String} raw - Raw TOML
     * @param {String} [path] - Relative parent path
     * @return {TomlParsingResult}
     */
    parse(raw, path = '') {
        this.res = new TomlParsingResult(raw)

        for (let fieldDescriptor of this.schema.fields) {
            const validationRule = fieldDescriptor.rules,
                key = this.getFieldKey(fieldDescriptor)

            let value = raw[key],
                nested = false

            if (validationRule.indexOf('array') === 0) {
                value = this.parseArray(fieldDescriptor, value || [], path)
                nested = true
            }

            if (validationRule.indexOf('object') === 0) {
                value = this.parseObject(fieldDescriptor, value, path)
                nested = true
            }

            if (value !== undefined || validationRule.indexOf('required') >= 0) {
                this.res.data[fieldDescriptor.field] = value
                if (!nested) {
                    let validationResult = validateField(fieldDescriptor, value, path)
                    if (validationResult.failed) {
                        this.res.addWarning(validationResult)
                    }
                }
            }
        }
        this.res.data.__schema = this.schema
        return this.res
    }

    getFieldKey(fieldDescriptor) {
        const {uppercase, prefix} = this.schema.params
        let key = fieldDescriptor.field
        if (prefix) {
            key = prefix + key
        }
        if (uppercase) {
            key = key.toUpperCase()
        }
        return key
    }

    getChildSchemaParser(fieldDescriptor) {
        const schema = fieldDescriptor.rules.split(':').pop()
        return new TomlSchemaParser(schema)
    }

    parseArray(fieldDescriptor, value, path) {
        //check that field is array
        const vres = validateField(fieldDescriptor, value, path)
        if (vres.failed) {
            this.res.addWarning(vres)
            return null
        }

        //get child schema parser
        const parser = this.getChildSchemaParser(fieldDescriptor)

        //treat is as plain array
        if (!parser.schema) return this.parsePlainArray(fieldDescriptor, value, path)

        const res = value.map((rawItem, i) => {
            const parsed = parser.parse(rawItem, `${path}${this.getFieldKey(fieldDescriptor)}[${i}]`)
            if (parsed.hasWarnings) {
                this.res.addWarning(parsed.warnings)
            }
            return parsed.data
        })
        return res.length ? res : null
    }

    parsePlainArray(fieldDescriptor, value, path) {
        if (path) {
            path += '.'
        }
        const key = this.getFieldKey(fieldDescriptor),
            validationResults = validateArray(fieldDescriptor.rules.split(':').pop(), value, `${path}${key}`)
        if (validationResults.failed) {
            for (let validationResult of validationResults.errors) {
                this.res.addWarning(validationResult)
            }
        }
        return value
    }

    parseObject(fieldDescriptor, value, path) {
        //check that field is array
        const vres = validateField(fieldDescriptor, value, path)
        if (vres.failed) {
            this.res.addWarning(vres)
            return {}
        }
        if (!value) return {}
        const parser = this.getChildSchemaParser(fieldDescriptor),
            parsed = parser.parse(value, `${path}${this.getFieldKey(fieldDescriptor)}`)

        if (parsed.hasWarnings) {
            this.res.addWarning(parsed.warnings)
        }
        return parsed.data
    }
}

/**
 * Parse and validate raw objects retrieved from TOML file according to specific schema
 * @param {String} stellarToml - Raw TOML file to parse
 */
function parseToml(stellarToml) {
    if (!stellarToml) {
        return new TomlParsingResult('', new ValidationResult(null, null, `File "/.well-known/stellar.toml" not found.`))
    }
    let converted
    try {
        converted = toml.parse(stellarToml)
    } catch (e) {
        return new TomlParsingResult(stellarToml, new ValidationResult(null, null, `Failed to parse stellar.toml. Parsing error on line ${e.line}, column ${e.column}: ${e.message}`))
    }

    const parser = new TomlSchemaParser('root')

    return parser.parse(converted)
}

export {parseToml, TomlSchemaParser, TomlParsingResult}