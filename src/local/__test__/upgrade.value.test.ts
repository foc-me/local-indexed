import "fake-indexeddb/auto"
import localIndexed from "../index"

const databaseName = "local-indexed"
const storeName = "test-store"

describe("upgrade", () => {
    it("no database", async () => {
        const indexed = localIndexed(databaseName)
        expect(await indexed.version()).toBe(0)
        expect((await localIndexed.databases()).length).toEqual(0)
        expect(await localIndexed.exists(databaseName)).toBe(false)
    })
    it("check collection create", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(1, (context) => {
            const collection = context.collection(storeName)
            collection.create({ keyPath: "id", autoIncrement: true })
        })
        expect(await localIndexed.version(databaseName)).toBe(1)
        expect(await indexed.version()).toBe(1)
        expect((await indexed.stores()).length).toBe(1)
        expect(await indexed.exists(storeName)).toBe(true)
    })
    it("delete database", async () => {
        await localIndexed.deleteDatabase(databaseName)
        const indexed = localIndexed(databaseName)
        expect(await indexed.version()).toBe(0)
        expect((await localIndexed.databases()).length).toEqual(0)
        expect(await localIndexed.exists(databaseName)).toBe(false)
    })
})