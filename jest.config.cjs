module.exports = {
    setupFiles: ['<rootDir>/test/setup-dom.cjs'],
    //components import their styles for side effects only - stub them out in the test env
    moduleNameMapper: {'\.(scss|css)$': '<rootDir>/test/style-stub.cjs'},
    //stellar-sdk's CJS build requires ESM-only packages, which jest's CJS runtime cannot load as-is
    transformIgnorePatterns: ['node_modules/(?!.*(uint8array-extras|@exodus|@noble|@stellar[+/]js-xdr))'],
    transform: {
        '^.+\\.js$': ['@swc/jest', {
            jsc: {
                parser: {syntax: 'ecmascript', jsx: true},
                transform: {react: {runtime: 'classic'}}
            },
            module: {type: 'commonjs'}
        }]
    }
}
