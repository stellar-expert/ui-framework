import TomlSchema from './toml-schema'

const orgSchema = new TomlSchema([
    {
        field: 'name',
        label: 'Organization name',
        rules: 'string',
        description: 'Legal name of your organization',
        expanded: true
    },
    {
        field: 'dba',
        label: 'Doing business as',
        rules: 'string',
        description: 'DBA ("doing business as") of your organization, if applicable.',
        expanded: true
    },
    {
        field: 'url',
        label: 'Website',
        rules: 'url|https',
        description: 'Your organization\'s official URL. Your stellar.toml must be hosted on the same domain.',
        expanded: true
    },
    {
        field: 'logo',
        label: 'Logo',
        rules: 'url|https',
        description: 'Your organization\'s logo link.'
    },
    {
        field: 'description',
        label: 'Description',
        rules: 'string',
        description: 'Short description of your organization.',
        expanded: true
    },
    {
        field: 'physical_address',
        label: 'Physical address',
        rules: 'string',
        description: 'Physical address for your organization.',
        expanded: true
    },
    {
        field: 'physical_address_attestation',
        label: 'Physical address attestation',
        rules: 'url|https',
        description: 'URL on the same domain as your organization website that contains an image or pdf official document attesting to your physical address. It must list your organization name or "doing business as" as the party at the address. Only documents from an official third party are acceptable. E.g. a utility bill, mail from a financial institution, or business license.'
    },
    {
        field: 'phone_number',
        label: 'Phone number',
        rules: 'string',
        description: 'Your organization\'s phone number.'
    },
    {
        field: 'phone_number_attestation',
        label: 'Phone number attestation',
        rules: 'url|https',
        description: 'URL on the same domain as your organization website that contains an image or pdf of a phone bill showing both the phone number and your organization\'s name.'
    },
    {
        field: 'keybase',
        label: 'Keybase account',
        rules: 'string',
        description: 'A Keybase account name for your organization. Should contain proof of ownership of any public online accounts you list here, including your organization\'s domain.'
    },
    {
        field: 'twitter',
        label: 'Twitter account',
        rules: 'string',
        description: 'Your organization\'s Twitter account.'
    },
    {
        field: 'github',
        label: 'Github account',
        rules: 'string',
        description: 'Your organization\'s Github account.'
    },
    {
        field: 'official_email',
        label: 'Official email',
        rules: 'email',
        description: 'An email where clients can contact your organization. Must be hosted at your domain.',
        expanded: true
    },
    {
        field: 'licensing_authority',
        label: 'Licensing authority',
        rules: 'string',
        description: 'Name of the authority or agency that licensed your organization, if applicable.'
    },
    {
        field: 'license_type',
        label: 'License type',
        rules: 'string',
        description: 'Type of financial or other license your organization holds, if applicable.'
    },
    {
        field: 'license_number',
        label: 'License number',
        rules: 'string',
        description: 'Official license number of your organization, if applicable.'
    }
], {
    prefix: 'org_',
    uppercase: true
})

export default orgSchema