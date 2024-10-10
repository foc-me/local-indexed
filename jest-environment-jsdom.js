const { TestEnvironment } = require("jest-environment-jsdom")

// fix structuredClone is undefined
class FixJSDOMEnvironment extends TestEnvironment {
    constructor(...args) {
        super(...args)
        this.global.structuredClone = structuredClone
    }
}

module.exports = FixJSDOMEnvironment