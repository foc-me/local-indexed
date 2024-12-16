import "fake-indexeddb/auto"
import localIndexed from "../../src/indexed"

const databaseName = "local-indexed"
const storeName = "test-store"

describe("check cursor", () => {
    it("check create", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async () => {
            const store = indexed.collection(storeName)
            store.create({ keyPath: "id", autoIncrement: true })
        })
        expect(await indexed.version()).toBe(1)
    })
    it("check create info", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection(storeName)
        const info = await store.info()
        expect(info.name).toBe(storeName)
        expect(info.keyPath).toBe("id")
        expect(info.autoIncrement).toBe(true)
        expect(info.indexes).toEqual({})

        const indexKeys = Object.keys(info.indexes)
        expect(indexKeys).toEqual([])
        expect(indexKeys.length).toBe(0)
    })
    it("check upgrade index", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async () => {
            const store = indexed.collection(storeName)
            store.createIndex("value", { unique: true })
            store.createIndex("odd")
            store.createIndex("re10")
        })
        expect(await indexed.version()).toBe(2)
    })
    it("check upgrade info", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection(storeName)
        const info = await store.info()
        expect(info.name).toBe(storeName)
        expect(info.keyPath).toBe("id")
        expect(info.autoIncrement).toBe(true)

        const indexKeys = Object.keys(info.indexes)
        expect(indexKeys).toEqual(["odd", "re10", "value"])
        expect(indexKeys.length).toBe(3)
        expect(info.indexes["odd"]).toEqual({ name: "odd", keyPath: "odd", unique: false, multiEntry: false })
        expect(info.indexes["re10"]).toEqual({ name: "re10", keyPath: "re10", unique: false, multiEntry: false })
        expect(info.indexes["value"]).toEqual({ name: "value", keyPath: "value", unique: true, multiEntry: false })
    })
})