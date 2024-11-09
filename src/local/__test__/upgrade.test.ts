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
    it("check collection indexes v1", async () => {
        const indexed = localIndexed(databaseName)
        const collection = indexed.collection(storeName)
        const indexes = await collection.getIndexes()
        expect(indexes.length).toBe(0)
    })
    it("check collection createIndex", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(2, (context) => {
            const collection = context.collection(storeName)
            collection.createIndex("odd", { unique: false })
            collection.createIndex("re10", { unique: false })
        })
        expect(await localIndexed.version(databaseName)).toBe(2)
        expect(await indexed.version()).toBe(2)
        expect((await indexed.stores()).length).toBe(1)
        expect(await indexed.exists(storeName)).toBe(true)
    })
    it("check collection indexes v2", async () => {
        const indexed = localIndexed(databaseName)
        const collection = indexed.collection(storeName)
        const indexes = await collection.getIndexes()
        expect(indexes.length).toBe(2)
        for (let i = 0; i < 2; i++) {
            const index = indexes[i]
            expect(index.name).toBe(index.keyPath)
            expect(index.unique).toBe(false)
            expect(index.multiEntry).toBe(false)
        }
    })
    it("check collection alter", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(3, (context) => {
            const collection = context.collection(storeName)
            collection.alter({
                keyPath: "id",
                autoIncrement: true,
                index: {
                    odd: { unique: false },
                    re10: { keyPath: "re10", unique: false }
                }
            })
        })
        expect(await localIndexed.version(databaseName)).toBe(3)
        expect(await indexed.version()).toBe(3)
        expect((await indexed.stores()).length).toBe(1)
        expect(await indexed.exists(storeName)).toBe(true)
    })
    it("check collection indexes v3", async () => {
        const indexed = localIndexed(databaseName)
        const collection = indexed.collection(storeName)
        const indexes = await collection.getIndexes()
        expect(indexes.length).toBe(2)
        for (let i = 0; i < 2; i++) {
            const index = indexes[i]
            expect(index.name).toBe(index.keyPath)
            expect(index.unique).toBe(false)
            expect(index.multiEntry).toBe(false)
        }
    })
    it("check collection deleteIndex", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(4, async (context) => {
            const collection = context.collection(storeName)
            const indexes = await collection.getIndexes()
            for (let i = 0; i < 2; i++) {
                collection.dropIndex(indexes[i].name)
            }
        })
        expect(await localIndexed.version(databaseName)).toBe(4)
        expect(await indexed.version()).toBe(4)
        expect((await indexed.stores()).length).toBe(1)
        expect(await indexed.exists(storeName)).toBe(true)
    })
    it("check collection indexes v4", async () => {
        const indexed = localIndexed(databaseName)
        const collection = indexed.collection(storeName)
        const indexes = await collection.getIndexes()
        expect(indexes.length).toBe(0)
    })
    it("delete database", async () => {
        await localIndexed.deleteDatabase(databaseName)
        const indexed = localIndexed(databaseName)
        expect(await indexed.version()).toBe(0)
        expect((await localIndexed.databases()).length).toEqual(0)
        expect(await localIndexed.exists(databaseName)).toBe(false)
    })
})