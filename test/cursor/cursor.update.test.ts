import "fake-indexeddb/auto"
import localIndexed from "../../src/indexed"

type Store = { id: number, value: number, odd?: "odd", re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("check indexed cursor remove", () => {
    it("check create", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection(storeName)
        await indexed.upgrade(async () => {
            store.create({ keyPath: "id", autoIncrement: true })
            store.createIndex("odd")
            store.createIndex("re10")
        })
        await store.insert(new Array(100).fill(undefined).map((item, index) => {
            const value = index + 1
            const odd = value % 2 === 0 ? { odd: "odd" } : {}
            return Object.assign({ value, re10: value % 10 }, odd)
        }))
        expect((await store.find()).length).toBe(100)
        expect(await indexed.version()).toBe(1)
    })
    it("check remove", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        const ids = await store.find(() => true).update((item) => {
            const value = item.value * 10
            return { id: item.id, value, odd: "odd", re10: 0 }
        })
        expect(ids.length).toBe(100)
        ids.forEach((id, index) => expect(id).toBe(index + 1))
        const items = await store.find()
        expect(items.length).toBe(100)
        items.forEach((item, index) => {
            expect(item.id).toBe(index + 1)
            expect(item.value).toBe((index + 1) * 10)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(0)
        })
    })
    it("reset data", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        await store.remove(IDBKeyRange.bound(1, 100))
        expect(await store.find(() => true).count()).toBe(0)
        await store.insert(new Array(100).fill(undefined).map((item, index) => {
            const value = index + 1
            const odd = value % 2 === 0 ? { odd: "odd" } : {}
            return Object.assign({ id: value,  value, re10: value % 10 }, odd)
        }))
        expect((await store.find()).length).toBe(100)
    })
    it("check odd cursor update", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        const ids = await store.find({ sort: "odd" }).update((item) => {
            const value = item.value * 10
            return { id: item.id, value, odd: "odd", re10: 0 }
        })
        expect(ids.length).toBe(50)
        ids.forEach((id, index) => expect(id).toBe((index + 1) * 2))
        const items = await store.find()
        expect(items.length).toBe(100)
        items.forEach((item, index) => {
            const value = index % 2 === 0 ? index + 1 : (index + 1) * 10
            const re10 = index % 2 === 0 ? index % 10 + 1 : 0
            expect(item.id).toBe(index + 1)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(index % 2 === 0 ? undefined : "odd")
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        })
    })
    it("check re10 cursor update", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        for (let i = 0; i < 5; i++) {
            const ids = await store.find({
                filter: (item) => item.re10 === i * 2 + 1,
                sort: "re10"
            }).update((item) => {
                const value = item.value * 10
                return { id: item.id, value, odd: "odd", re10: 0 }
            })
            expect(ids.length).toBe(10)
            ids.forEach((id, index) => expect(id).toBe(index * 10 + i * 2 + 1))
        }
        const items = await store.find()
        expect(items.length).toBe(100)
        items.forEach((item, index) => {
            expect(item.id).toBe(index + 1)
            expect(item.value).toBe((index + 1) * 10)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(0)
        })
    })
})