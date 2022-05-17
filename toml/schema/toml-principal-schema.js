import TomlSchema from './toml-schema'

const principalSchema = new TomlSchema([
    {
        field: 'name',
        label: 'Name',
        rules: 'required|string',
        description: 'Full legal name.',
        expanded: true
    },
    {
        field: 'email',
        label: 'Email',
        rules: 'email',
        description: 'Business email address for the principal.',
        expanded: true
    },
    {
        field: 'keybase',
        label: 'Keybase',
        rules: 'string',
        description: 'Personal Keybase account. Should include proof of ownership for other online accounts, as well as the organization\'s domain.'
    },
    {
        field: 'telegram',
        label: 'Telegram',
        rules: 'string',
        description: 'Personal Telegram account.'
    },
    {
        field: 'twitter',
        label: 'Twitter',
        rules: 'string',
        description: 'Personal Twitter account.'
    },
    {
        field: 'github',
        label: 'Github',
        rules: 'string',
        description: 'Personal Github account.'
    },
    {
        field: 'id_photo_hash',
        label: 'Id photo hash',
        rules: 'hash',
        description: 'SHA-256 hash of a photo of the principal\'s government-issued photo ID.'
    },
    {
        field: 'verification_photo_hash',
        label: 'Verification photo hash',
        rules: 'hash',
        description: 'SHA-256 hash of a verification photo of principal. Should be well-lit and contain: principal holding ID card and signed, dated, hand-written message stating "I, {name}, am a principal of {org_name}, a Stellar token issuer with address {issuer_address}..."'
    }
])

export default principalSchema