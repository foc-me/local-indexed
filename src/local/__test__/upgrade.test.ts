import "fake-indexeddb/auto"
import localIndexed from "../index"

const databaseName = "local-indexed"
const storeName = "test-store"

describe("check indexed.upgrade", () => {
    it("check empty database", async () => {
        const indexed = localIndexed(databaseName)
        expect(await indexed.version()).toBe(0)
        expect((await localIndexed.databases()).length).toBe(0)
        expect(await localIndexed.exists(databaseName)).toBe(false)
    })
    it("check create", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade((event) => {
            expect(event.oldVersion).toBe(0)
            expect(event.newVersion).toBe(1)
            const collection = indexed.collection(storeName)
            collection.create({ keyPath: "id", autoIncrement: true })
        })
        expect(await localIndexed.version(databaseName)).toBe(1)
        expect(await indexed.version()).toBe(1)
        expect((await indexed.stores()).length).toBe(1)
        expect(await indexed.exists(storeName)).toBe(true)

        const collection = indexed.collection(storeName)
        const indexes = await collection.getIndexes()
        expect(indexes.length).toBe(0)
    })
    it("check createIndex", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(() => {
            const collection = indexed.collection(storeName)
            collection.createIndex("odd", { unique: false })
            collection.createIndex("re10", { unique: false })
        })
        expect(await localIndexed.version(databaseName)).toBe(2)
        expect(await indexed.version()).toBe(2)
        expect((await indexed.stores()).length).toBe(1)
        expect(await indexed.exists(storeName)).toBe(true)

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
    it("check alter", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(() => {
            const collection = indexed.collection(storeName)
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
    it("check deleteIndex", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async () => {
            const collection = indexed.collection(storeName)
            const indexes = await collection.getIndexes()
            for (let i = 0; i < 2; i++) {
                collection.dropIndex(indexes[i].name)
            }
        })
        expect(await localIndexed.version(databaseName)).toBe(4)
        expect(await indexed.version()).toBe(4)
        expect((await indexed.stores()).length).toBe(1)
        expect(await indexed.exists(storeName)).toBe(true)

        const collection = indexed.collection(storeName)
        const indexes = await collection.getIndexes()
        expect(indexes.length).toBe(0)
    })
    it("check drop", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async () => {
            const collection = indexed.collection(storeName)
            collection.drop()
        })
        expect(await localIndexed.version(databaseName)).toBe(5)
        expect(await indexed.version()).toBe(5)
        expect((await indexed.stores()).length).toBe(0)
        expect(await indexed.exists(storeName)).toBe(false)
    })
    it("check delete database", async () => {
        await localIndexed.deleteDatabase(databaseName)
        const indexed = localIndexed(databaseName)
        expect(await indexed.version()).toBe(0)
        expect((await localIndexed.databases()).length).toEqual(0)
        expect(await localIndexed.exists(databaseName)).toBe(false)
    })
})