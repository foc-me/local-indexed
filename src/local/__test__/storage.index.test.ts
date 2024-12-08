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

        const storage = indexed.storage(storeName)
        for (let i = 1; i <= 100; i++) {
            const odd = i % 2 === 0 ? { odd: "odd" } : {}
            const id = await storage.setItem<number>(Object.assign({ value: i, re10: i % 10 }, odd))
            expect(id).toBe(i)
        }

        expect(await localIndexed.version(databaseName)).toBe(1)
        expect(await indexed.version()).toBe(1)
        expect((await indexed.stores()).length).toBe(1)
        expect(await indexed.exists(storeName)).toBe(true)

        const collection = indexed.collection(storeName)
        const indexes = await collection.getIndexes()
        expect(indexes.length).toBe(2)
        expect(indexes.map(item => item.name)).toEqual(["odd", "re10"])
    })
    it("check odd length", async () => {
        const indexed = localIndexed(databaseName)
        const storage = indexed.storage(storeName).index("odd")
        expect(await storage.length()).toBe(50)
        expect(await storage.length("odd")).toBe(50)
        expect(await storage.length(IDBKeyRange.bound("odd", "odd"))).toBe(50)
    })
    it("check re10 length", async () => {
        const indexed = localIndexed(databaseName)
        const storage = indexed.storage(storeName).index("re10")
        expect(await storage.length()).toBe(100)
        for (let i = 0; i < 10; i++) {
            expect(await storage.length(i)).toBe(10)
        }
        for (let i = 0; i < 10; i++) {
            const range = IDBKeyRange.bound(i, 9)
            expect(await storage.length(range)).toBe(100 - i * 10)
        }
    })
    it("check odd keys", async () => {
        const indexed = localIndexed(databaseName)
        const storage = indexed.storage(storeName).index("odd")
        expect((await storage.keys()).length).toBe(50)
        expect((await storage.keys("odd")).length).toBe(50)
        const keys = await storage.keys(IDBKeyRange.bound("odd", "odd"))
        expect(keys.length).toBe(50)
        keys.forEach((key, index) => expect(key).toBe((index + 1) * 2))
    })
    it("check re10 keys", async () => {
        const indexed = localIndexed(databaseName)
        const storage = indexed.storage(storeName).index("re10")
        const keys = await storage.keys()
        expect(keys.length).toBe(100)
        keys.forEach((key, index) => {
            if (index < 10) expect(key).toBe((index + 1) * 10)
            else expect(key).toBe(index % 10 * 10 + Math.floor(index / 10))
        })
        for (let i = 0; i < 10; i++) {
            const keys = await storage.keys(i)
            expect(keys.length).toBe(10)
            keys.forEach((key, index) => {
                expect(key).toBe(i === 0 ? (index + 1) * 10 : index * 10 + i)
            })
        }
        for (let i = 0; i < 10; i++) {
            const keys = await storage.keys(IDBKeyRange.bound(i, 9))
            expect(keys.length).toBe(100 - i * 10)
            keys.forEach((key, index) => {
                if (i === 0) {
                    if (index < 10) expect(key).toBe((index + 1) * 10)
                    else expect(key).toBe(index % 10 * 10 + Math.floor(index / 10))
                } else expect(key).toBe(index % 10 * 10 + Math.floor(index / 10) + i)
            })
        }
    })
    it("check odd values", async () => {
        const indexed = localIndexed(databaseName)
        const storage = indexed.storage<Store>(storeName).index("odd")
        expect((await storage.values()).length).toBe(50)
        expect((await storage.values("odd")).length).toBe(50)
        const values = await storage.values(IDBKeyRange.bound("odd", "odd"))
        expect(values.length).toBe(50)
        values.forEach((item, index) => {
            const value = (index + 1) * 2
            const re10 = (index % 5 + 1) * 2
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        })
    })
    it("check re10 values", async () => {
        const indexed = localIndexed(databaseName)
        const storage = indexed.storage<Store>(storeName).index("re10")
        const values = await storage.values()
        expect(values.length).toBe(100)
        values.forEach((item, index) => {
            if (index < 10) {
                const value = (index + 1) * 10
                expect(item.id).toBe(value)
                expect(item.value).toBe(value)
                expect(item.odd).toBe("odd")
                expect(item.re10).toBe(0)
            } else {
                const re10 = Math.floor(index / 10)
                const value = index % 10 * 10 + re10
                const odd = re10 % 2 === 1 ? undefined : "odd"
                expect(item.id).toBe(value)
                expect(item.value).toBe(value)
                expect(item.odd).toBe(odd)
                expect(item.re10).toBe(re10)
            }
        })
        for (let i = 0; i < 10; i++) {
            const values = await storage.values(i)
            expect(values.length).toBe(10)
            values.forEach((item, index) => {
                const value = i === 0 ? (index + 1) * 10 : index * 10 + i
                const odd = i % 2 === 1 ? undefined : "odd"
                expect(item.id).toBe(value)
                expect(item.value).toBe(value)
                expect(item.odd).toBe(odd)
                expect(item.re10).toBe(i)
            })
        }
        for (let i = 0; i < 10; i++) {
            const values = await storage.values(IDBKeyRange.bound(i, 9))
            expect(values.length).toBe(100 - i * 10)
            values.forEach((item, index) => {
                if (i === 0) {
                    const re10 = Math.floor(index / 10)
                    const value = index < 10 ? (index + 1) * 10 : index % 10 * 10 + re10
                    const odd = re10 % 2 === 1 ? undefined : "odd"
                    expect(item.id).toBe(value)
                    expect(item.value).toBe(value)
                    expect(item.odd).toBe(odd)
                    expect(item.re10).toBe(re10)
                } else {
                    const re10 = Math.floor(index / 10) + i
                    const value = index % 10 * 10 + re10
                    const odd = re10 % 2 === 1 ? undefined : "odd"
                    expect(item.id).toBe(value)
                    expect(item.value).toBe(value)
                    expect(item.odd).toBe(odd)
                    expect(item.re10).toBe(re10)
                }
            })
        }
    })
    it("check delete database", async () => {
        await localIndexed.deleteDatabase(databaseName)
        const indexed = localIndexed(databaseName)
        expect(await indexed.version()).toBe(0)
        expect((await localIndexed.databases()).length).toEqual(0)
        expect(await localIndexed.exists(databaseName)).toBe(false)
    })
})