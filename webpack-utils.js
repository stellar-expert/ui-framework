const {name} = require('./package.json')

const uiFrameworkWebpackUtils = {
    generateWebpackExcludeExcept() {
        const excludedModule = name.replace(/\\/, '\\')
        return [
            new RegExp(`node_modules\\/(?!${excludedModule}\\/).*`),
            new RegExp(`node_modules\\/${excludedModule}\\/node_modules\\/.*`)
        ]
    }
}

module.exports = uiFrameworkWebpackUtils