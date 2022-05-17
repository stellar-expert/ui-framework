/**
 * Schema parsing parameters.
 * @typedef {Object} SchemaParams
 * @property {string} [prefix] - Shared field names prefix.
 * @property {boolean} [uppercase] - Whether keys are in the upper-case register or not.
 */

/**
 * Schema field descriptor.
 * @typedef {Object} SchemaField
 * @property {string} field - Field name.
 * @property {string} label - Display name.
 * @property {string} rules - Validation rules.
 * @property {string} description - Extended description for tooltips.
 */

class TomlSchema {
    /**
     *
     * @param {Array<SchemaField>} fields - Schema fields.
     * @param {SchemaParams} [params] - Schema parsing params.
     */
    constructor(fields, params) {
        this.fields = fields
        this.params = params || {}
        this.fieldsMap = {}
        for (let fieldDescriptor of fields) {
            fieldDescriptor.schema = this
            this.fieldsMap[fieldDescriptor.field] = fieldDescriptor
        }
    }

    /**
     * Schema fields.
     * @type {Array<object>}
     */
    fields

    /**
     * Field descriptors mapped by field name.
     * @type {object}
     */
    fieldsMap


    /**
     * Schema params.
     * @type {SchemaParams}
     */
    params
}

export default TomlSchema