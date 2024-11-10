import "fake-indexeddb/auto"
import localIndexed from "../index"

type Store = { id: number, value: number, odd?: "odd", re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("upgrade", () => {
    it("no database", async () => {
        const indexed = localIndexed(databaseName)
        expect(await indexed.version()).toBe(0)
        expect((await localIndexed.databases()).length).toEqual(0)
    })
    it("check create and collection insertOne", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(1, async (context) => {
            const collection = context.collection<Store>(storeName)
            collection.create({ keyPath: "id", autoIncrement: true })
            for (let i = 1; i <= 100; i++) {
                const odd = i % 2 === 0 ? { odd: "odd" } : {}
                const id = await collection.insertOne(Object.assign({ value: i, re10: i % 10 }, odd))
                expect(id).toBe(i)
            }
        })
        expect(await indexed.version()).toBe(1)
        expect((await indexed.stores()).length).toBe(1)
        expect(await indexed.exists(storeName)).toBe(true)

        const collection = indexed.collection<Store>(storeName)
        const indexes = await collection.getIndexes()
        expect(indexes.length).toBe(0)
        const items = await collection.values()
        expect(items.length).toBe(100)
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const value = i + 1
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(i % 2 === 1 ? "odd" : undefined)
            expect(item.re10).toBe((i + 1) % 10)
        }
    })
    it("check upgarde and collection values", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(2, async (context) => {
            const collection = context.collection<Store>(storeName)
            const items = await collection.values()
            expect(items.length).toBe(100)
            collection.alter({
                keyPath: "id",
                autoIncrement: true,
                index: {
                    odd: { unique: false },
                    re10: { unique: false }
                }
            })
            for (let i = 0; i < items.length; i++) {
                const item = items[i]
                const value = item.value * 10
                const odd = value % 2 === 0 ? { odd: "odd" } : {}
                const id = await collection.insertOne(Object.assign({
                    id: item.id,
                    value,
                    re10: value % 10
                }, odd))
                expect(id).toBe(items[i].id)
            }
        })
        expect(await indexed.version()).toBe(2)
        expect((await indexed.stores()).length).toBe(1)
        expect(await indexed.exists(storeName)).toBe(true)

        const collection = indexed.collection<Store>(storeName)
        const indexes = await collection.getIndexes()
        expect(indexes.length).toBe(2)
        expect(indexes.map(item => item.name)).toEqual(["odd", "re10"])
        const items = await collection.values()
        expect(items.length).toBe(100)
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const value = i + 1
            expect(item.id).toBe(value)
            expect(item.value).toBe(value * 10)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(0)
        }
    })
    it("delete database", async () => {
        await localIndexed.deleteDatabase(databaseName)
        const indexed = localIndexed(databaseName)
        expect(await indexed.version()).toBe(0)
        expect((await localIndexed.databases()).length).toEqual(0)
        expect(await localIndexed.exists(databaseName)).toBe(false)
    })
})