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
        await indexed.upgrade((event) => {
            expect(event.oldVersion).toBe(1)
            expect(event.newVersion).toBe(2)
            const collection = indexed.collection(storeName)
            collection.createIndex("odd", { unique: false })
            collection.createIndex("re10")
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
    it("check error", async () => {
        const indexed = localIndexed(databaseName)
        await expect(indexed.upgrade((event) => {
            expect(event.oldVersion).toBe(2)
            expect(event.newVersion).toBe(3)
            throw new Error("error")
        })).rejects.toThrow("error")
    })
    it("check abort", async () => {
        const indexed = localIndexed(databaseName)
        await expect(indexed.upgrade((event) => {
            expect(event.oldVersion).toBe(3)
            expect(event.newVersion).toBe(4)
            indexed.abort()
        })).resolves.toBe(undefined)
    })
    it("check upgrade action error", async () => {
        const indexed = localIndexed(databaseName)
        await expect(indexed.upgrade((event) => {
            try {
                expect(event.oldVersion).toBe(3)
                expect(event.newVersion).toBe(4)
                const collection = indexed.collection(storeName)
                collection.create({ keyPath: "id", autoIncrement: true })
            } catch (error) {
                indexed.abort()
                throw error
            }
        })).rejects.toThrow("objectStore 'test-store' already exists")
        const collection = indexed.collection(storeName)
        expect(() => collection.create({
            keyPath: "id",
            autoIncrement: true
        })).toThrow("collection.create requires upgrade")
        expect(() => collection.alter({
            keyPath: "id",
            autoIncrement: true
        })).toThrow("collection.alter requires upgrade")
        expect(() => collection.drop()).toThrow("collection.drop requires upgrade")
        expect(() => collection.createIndex("odd")).toThrow("collection.createIndex requires upgrade")
        expect(() => collection.dropIndex("odd")).toThrow("collection.dropIndex requires upgrade")
        await expect(indexed.upgrade(() => {
            try {
                const collection = indexed.collection("no-store")
                collection.createIndex("odd")
            } catch (error) {
                indexed.abort()
                throw error
            }
        })).rejects.toThrow("objectStore 'no-store' does not exist")
        await expect(indexed.upgrade(() => {
            try {
                const collection = indexed.collection("no-store")
                collection.dropIndex("odd")
            } catch (error) {
                indexed.abort()
                throw error
            }
        })).rejects.toThrow("objectStore 'no-store' does not exist")
    })
    it("check abort error", () => {
        const indexed = localIndexed(databaseName)
        expect(() => indexed.abort()).toThrow("abort() requires transaction or upgrade")
    })
    it("check alter", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade((event) => {
            expect(event.oldVersion).toBe(3)
            expect(event.newVersion).toBe(4)
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
        expect(await localIndexed.version(databaseName)).toBe(4)
        expect(await indexed.version()).toBe(4)
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
    it("check dropIndex", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async (event) => {
            expect(event.oldVersion).toBe(4)
            expect(event.newVersion).toBe(5)
            const collection = indexed.collection(storeName)
            const indexes = await collection.getIndexes()
            for (let i = 0; i < 2; i++) {
                collection.dropIndex(indexes[i].name)
            }
        })
        expect(await localIndexed.version(databaseName)).toBe(5)
        expect(await indexed.version()).toBe(5)
        expect((await indexed.stores()).length).toBe(1)
        expect(await indexed.exists(storeName)).toBe(true)

        const collection = indexed.collection(storeName)
        const indexes = await collection.getIndexes()
        expect(indexes.length).toBe(0)
    })
    it("check drop", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async (event) => {
            expect(event.oldVersion).toBe(5)
            expect(event.newVersion).toBe(6)
            const collection = indexed.collection(storeName)
            collection.drop()
        })
        expect(await localIndexed.version(databaseName)).toBe(6)
        expect(await indexed.version()).toBe(6)
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