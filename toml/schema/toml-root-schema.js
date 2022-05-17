import TomlSchema from './toml-schema'

const rootSchema = new TomlSchema([
    {
        field: 'network_passphrase',
        label: 'Network passphrase',
        rules: 'string',
        description: 'The passphrase for the specific Stellar network this infrastructure operates on.'
    },
    {
        field: 'federation_server',
        label: 'Federation server',
        rules: 'url|https',
        description: 'The endpoint for clients to resolve stellar addresses for users on your domain via SEP-2 federation protocol.'
    },
    {
        field: 'auth_server',
        label: 'Authentication server',
        rules: 'url|https',
        description: 'The endpoint used for SEP-3 Compliance Protocol.'
    },
    {
        field: 'transfer_server',
        label: 'Transfer server',
        rules: 'url|https',
        description: 'The server used for SEP-6 Anchor/Client interoperability.'
    },
    {
        field: 'transfer_server_sep0024',
        label: 'Interactive transfer server',
        rules: 'url|https',
        description: 'The server used for SEP-24 Anchor/Client interoperability.'
    },
    {
        field: 'direct_payment_server',
        label: 'Direct payment server',
        rules: 'url|https',
        description: 'The server used for receiving SEP-31 direct fiat-to-fiat payments.'
    },
    {
        field: 'web_auth_endpoint',
        label: 'Web authentication endpoint',
        rules: 'url|https',
        description: 'The endpoint used for SEP-10 Web Authentication.'
    },
    {
        field: 'kyc_server',
        label: 'KYC server',
        rules: 'url|https',
        description: 'The server used for SEP-12 Anchor/Client customer info transfer.'
    },
    {
        field: 'signing_key',
        label: 'Signing key',
        rules: 'pubkey',
        description: 'The signing key is used for SEP-3 Compliance Protocol (deprecated) and SEP-10 Authentication Protocol.'
    },
    {
        field: 'uri_request_signing_key',
        label: 'SEP7 signing key',
        rules: 'pubkey',
        description: 'The signing key is used for SEP-7 delegated signing.'
    },
    {
        field: 'accounts',
        label: 'Organization accounts',
        rules: 'array:pubkey',
        description: 'A list of Stellar accounts that are controlled by this domain.'
    },
    {
        field: 'node_names',
        label: 'Node names',
        rules: 'array:pubkeyvar',
        description: 'Friendly names for nodes and accounts.'
    },
    {
        field: 'horizon_url',
        label: 'Horizon server',
        rules: 'url|https',
        description: 'Location of public-facing Horizon instance.'
    },
    {
        field: 'validators',
        label: 'Validators',
        rules: 'array:validator',
        description: 'A list of validator public keys that are declared to be used by this domain for validating ledgers. They are authorized signers for the domain.'
    },
    {
        field: 'principals',
        label: 'Principals',
        rules: 'array:principal',
        description: 'Identifying information for the primary point of contact or principal(s) of the organization.'
    },
    {
        field: 'documentation',
        label: 'Documentation',
        rules: 'object:org',
        description: 'Issuer documentation.'
    },
    {
        field: 'currencies',
        label: 'Currencies',
        rules: 'array:currency',
        description: 'Assets issued by the organization.'
    },
    {
        field: 'history',
        label: 'History archives',
        rules: 'array:url',
        description: 'List of history archives maintained by this domain.'
    }
], {
    uppercase: true
})

export default rootSchema