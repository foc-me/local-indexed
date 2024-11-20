const { TestEnvironment } = require("jest-environment-jsdom")

// fix structuredClone is undefined
class FixJSDOMEnvironment extends TestEnvironment {
    constructor(...args) {
        super(...args)
        this.global.structuredClone = structuredClone
        // fake-indexeddb 在 node 中使用的构造函数可能与 jsdom 不同
        // 替换这些构造函数可能无法使测试覆盖 indexeddb 在浏览器中的行为
        this.global.Blob = Blob
        this.global.File = File
        this.global.ArrayBuffer = ArrayBuffer
        this.global.Date = Date
        this.global.RegExp = RegExp
        this.global.Error = Error
    }
}

module.exports = FixJSDOMEnvironment