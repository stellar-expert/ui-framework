import TomlSchema from './toml-schema'

const validatorSchema = new TomlSchema([
    {
        field: 'alias',
        label: 'Alias',
        rules: 'string',
        description: 'A short name for display in stellar-core configs.'
    },
    {
        field: 'display_name',
        label: 'Display name',
        rules: 'string',
        description: 'A human-readable name for display in quorum explorers and other interfaces.'
    },
    {
        field: 'public_key',
        label: 'Public key',
        rules: 'pubkey',
        description: 'Public key of the Stellar account associated with the node.'
    },
    {
        field: 'host',
        label: 'Host',
        rules: 'string',
        description: 'The IP:port or domain:port peers can use to connect to the node.'
    },
    {
        field: 'history',
        label: 'History',
        rules: 'url',
        description: 'The location of the history archive published by this validator.'
    }
])

export default validatorSchema