import "fake-indexeddb/auto"
import localIndexed from "../../src/indexed"

type Store = { id: number, value: number, odd?: "odd", re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("check indexed cursor update", () => {
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
        expect(await store.find((item) => item.id > 0 && item.id < 21).remove()).toBe(20)
        expect(await store.find(() => true).count()).toBe(80)
    })
    it("check odd cursor remove", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        expect(await store.find({ sort: "odd" }).remove()).toBe(40)
        expect(await store.find(() => true).count()).toBe(40)
    })
    it("check re10 cursor remove", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        expect(await store.find({ sort: "re10" }).remove()).toBe(40)
        expect(await store.find(() => true).count()).toBe(0)
    })
})