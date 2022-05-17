import TomlSchema from './toml-schema'

const quorumSetSchema = new TomlSchema([
    {
        field: 'validators',
        label: 'Validators',
        rules: 'required|array:pubkey',
        description: 'List of authoritative validators for organization. This can potentially be a quorum set.'
    }
], {
    uppercase: true
})

export default quorumSetSchema