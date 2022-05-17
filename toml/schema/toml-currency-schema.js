import TomlSchema from './toml-schema'

const currencySchema = new TomlSchema([
    {
        field: 'code',
        label: 'Asset code',
        rules: 'required|string|max:12',
        description: 'Asset code. Should be unique for the issuing address.'
    },
    //{field: 'code_template',label: 'Code template',rules: 'string|max:12',description: 'A pattern with ? as a single character wildcard. Allows a [[CURRENCIES]] entry to apply to multiple assets that share the same info. An example is futures, where the only difference between issues is the date of the contract. E.g. CORN???????? to match codes such as CORN20180604.'},
    {
        field: 'issuer',
        label: 'Issuer address',
        rules: 'required|pubkey',
        description: 'Token issuer Stellar public key.'
    },
    //TODO: set automatically
    {
        field: 'status',
        label: 'Status',
        hidden: true,
        rules: 'string|in:live,dead,test,private',
        description: 'Current status of the token: dead/for testing/for private use or is live and should be listed in live exchanges.',
        expanded: true
    },
    {
        field: 'name',
        label: 'Friendly name',
        rules: 'string|max:20',
        description: 'A short name for the token.',
        expanded: true
    },
    {
        field: 'desc',
        label: 'Description',
        rules: 'string|max:250',
        description: 'Description of the token and what it represents.',
        expanded: true
    },
    {
        field: 'display_decimals',
        label: 'Decimals',
        rules: 'integer|min:0|max:7',
        description: 'Preference for number of decimals to show when a client displays currency balance.'
    },
    {
        field: 'conditions',
        label: 'Issuing conditions',
        rules: 'string|max:250',
        description: 'Token issuing conditions.'
    },
    {
        field: 'image',
        label: 'Icon url',
        rules: 'url|https',
        description: 'URL to image representing token. The image should be in PNG or JPEG format.'
    },
    {
        field: 'fixed_number',
        label: 'Fixed tokens supply',
        hidden: true,
        rules: 'numeric',
        description: 'Fixed number of tokens, if the number of tokens issued will never change.',
        expanded: true
    },
    {
        field: 'max_number',
        label: 'Max supply',
        rules: 'numeric',
        description: 'Max number of tokens, if there will never be more than max_number tokens.',
        expanded: true
    },
    {
        field: 'is_unlimited',
        label: 'Is unlimited',
        hidden: true,
        rules: 'boolean',
        description: 'The number of tokens is dilutable at the issuer\'s discretion.',
        expanded: true
    },
    {
        field: 'is_asset_anchored',
        label: 'Anchored asset',
        hidden: true,
        rules: 'boolean',
        description: 'true if token can be redeemed for underlying asset, otherwise false.'
    },
    {//only when is_asset_anchored === true
        field: 'anchor_asset_type',
        label: 'Anchor asset type',
        rules: 'string|max:20',
        description: 'Type of asset anchored. Can be "fiat", "crypto", "stock", "bond", "commodity", "realestate", or other.'
    },
    {//only when is_asset_anchored === true
        field: 'anchor_asset',
        label: 'Anchor asset',
        rules: 'string|max:100',
        description: 'The real asset token is anchored to. E.g. "USD", "BTC", "SBUX", Address of real-estate investment property.'
    },
    { //only when is_asset_anchored === true
        field: 'redemption_instructions',
        label: 'Redemption instructions',
        rules: 'string|max:250',
        description: 'Instructions to redeem the underlying asset from tokens.',
        expanded: true
    },
    {
        field: 'collateral_addresses',
        label: 'Collateral addresses',
        rules: 'array:string',
        description: 'If this is an anchored crypto token, list of one or more public addresses that hold the assets for which you are issuing tokens.'
    },
    {
        field: 'collateral_address_messages',
        label: 'Collateral address messages',
        rules: 'array:string',
        description: 'Messages stating that funds in the collateral_addresses list are reserved to back the issued asset. See below for details.'
    },
    {
        field: 'collateral_address_signatures',
        label: 'Collateral address signatures',
        rules: 'array:string',
        description: 'These prove you control the collateral_addresses. For each address you list, sign the entry in collateral_address_messages with the address\'s private key and add the resulting string to this list as a base64-encoded raw signature.'
    },
    {
        field: 'attestation_of_reserve',
        label: 'Attestation_of_reserve',
        rules: 'url|https',
        description: 'URL to attestation or other proof, evidence, or verification of reserves, such as third-party audits.'
    }
    /*{
        field: 'regulated',
        label: 'regulated',
        rules: 'boolean',
        description: 'Indicates whether or not this is a SEP-0008 regulated asset. If missing, false is assumed.'
    },
    {
        field: 'approval_server',
        label: 'approval_server',
        rules: 'url|https',
        description: 'Url of a SEP-0008 compliant approval service that signs validated transactions.'
    },
    {
        field: 'approval_criteria',
        label: 'approval_criteria',
        rules: 'string|max:250',
        description: 'A human readable string that explains the issuer\'s requirements for approving transactions.'
    }*/
])

export default currencySchema