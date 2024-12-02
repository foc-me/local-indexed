import "fake-indexeddb/auto"
import localIndexed from "../index"

type Store = { id: number, value: number, odd?: "odd", re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("check indexed.storage", () => {
    it("check empty database", async () => {
        const indexed = localIndexed(databaseName)
        expect(await indexed.version()).toBe(0)
        expect((await localIndexed.databases()).length).toBe(0)
        expect(await localIndexed.exists(databaseName)).toBe(false)
    })
    it("check create", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(1, () => {
            const collection = indexed.collection(storeName)
            collection.create({ keyPath: "id", autoIncrement: true })
            collection.createIndex("odd", { unique: false })
            collection.createIndex("re10", { unique: false })
        })
        expect(await localIndexed.version(databaseName)).toBe(1)
        expect(await indexed.version()).toBe(1)
        expect((await indexed.stores()).length).toBe(1)
        expect(await indexed.exists(storeName)).toBe(true)

        const collection = indexed.collection(storeName)
        const indexes = await collection.getIndexes()
        expect(indexes.length).toBe(2)
        expect(indexes.map(item => item.name)).toEqual(["odd", "re10"])
    })
    it("check setItem", async () => {
        const indexed = localIndexed(databaseName)
        const storage = indexed.storage(storeName)
        for (let i = 1; i <= 100; i++) {
            const odd = i % 2 === 0 ? { odd: "odd" } : {}
            const id = await storage.setItem<number>(Object.assign({ value: i, re10: i % 10 }, odd))
            expect(id).toBe(i)
        }
    })
    it("check length", async () => {
        const indexed = localIndexed(databaseName)
        const storage = indexed.storage(storeName)
        expect(await storage.length()).toBe(100)
    })
    it("check getItem", async () => {
        const indexed = localIndexed(databaseName)
        const storage = indexed.storage<Store>(storeName)
        expect(await storage.length()).toBe(100)
        for (let i = 0; i < 100; i++) {
            const item = await storage.getItem(i + 1)
            if (item) {
                expect(item.id).toBe(i + 1)
                expect(item.value).toBe(i + 1)
                expect(item.odd).toBe(i % 2 === 1 ? "odd" : undefined)
                expect(item.re10).toBe((i + 1) % 10)
            } else throw new Error("item should not be undefined")
        }
        expect(await storage.getItem(101)).toBe(undefined)
    })
    it("check keys and values", async () => {
        const indexed = localIndexed(databaseName)
        const storage = indexed.storage<Store>(storeName)
        const keys = await storage.keys()
        const values = await storage.values()
        expect(keys.length).toBe(100)
        expect(values.length).toBe(100)
        for (let i = 0; i < values.length; i++) {
            const key = keys[i]
            const item = values[i]
            expect(key).toBe(i + 1)
            expect(item.id).toBe(i + 1)
            expect(item.value).toBe(i + 1)
            expect(item.odd).toBe(i % 2 === 1 ? "odd" : undefined)
            expect(item.re10).toBe((i + 1) % 10)
        }
    })
    it("check removeItem", async () => {
        const indexed = localIndexed(databaseName)
        const storage = indexed.storage<Store>(storeName)
        for (let i = 1; i <= 50; i++) {
            await storage.removeItem(i)
        }
        expect(await storage.length()).toBe(50)
        for (let i = 0; i < 100; i++) {
            const item = await storage.getItem(i + 1)
            if (i < 50) expect(item).toBe(undefined)
            else if (item) {
                expect(item.id).toBe(i + 1)
                expect(item.value).toBe(i + 1)
                expect(item.odd).toBe(i % 2 === 1 ? "odd" : undefined)
                expect(item.re10).toBe((i + 1) % 10)
            } else throw new Error("item should not be undefined")
        }
        expect(await storage.getItem(101)).toBe(undefined)
    })
    it("check removeItems", async () => {
        
    })
    it("check clear", async () => {
        const indexed = localIndexed(databaseName)
        const storage = indexed.storage(storeName)
        await storage.clear()
        expect(await storage.length()).toBe(0)
    })
    it("check delete database", async () => {
        await localIndexed.deleteDatabase(databaseName)
        const indexed = localIndexed(databaseName)
        expect(await indexed.version()).toBe(0)
        expect((await localIndexed.databases()).length).toEqual(0)
        expect(await localIndexed.exists(databaseName)).toBe(false)
    })
})