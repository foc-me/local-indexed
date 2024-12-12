import "fake-indexeddb/auto"
import localIndexed from "../../indexed"

type Store = { id: number, value: number, odd?: "odd", re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("check cursor", () => {
    it("check create", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async () => {
            const store = indexed.collection(storeName)
            store.create({ keyPath: "id", autoIncrement: true })
            store.createIndex("value", { unique: true })
            store.createIndex("odd")
            store.createIndex("re10")
            await store.insert(new Array(100).fill(undefined).map((item, index) => {
                const value = index + 1
                const odd = value % 2 === 0 ? { odd: "odd" } : {}
                return Object.assign({ value, re10: value % 10 }, odd)
            }))
        })
        expect(await indexed.version()).toBe(1)
    })
    it("check info", async () => {
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
    it("check count", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        for (let i = 0; i < 20; i++) {
            expect(await store.find(item => {
                return item.id === i + 1
            }).count()).toBe(1)
        }
        for (let i = 0; i < 3; i++) {
            const start = 20 + i * 10 + 1
            const end = start + 9
            expect(await store.find(item => {
                return item.id >= start && item.id <= end
            }).count()).toBe(10)
        }
        expect(await store.find(item => {
            return item.id >= 51
        }).count()).toBe(50)
    })
    it("check toList", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        const cursor = store.find(() => true)
        const items = await cursor.toList()
        expect(items.length).toBe(100)
        items.forEach((item, index) => {
            const re10 = index % 10 + 1
            expect(item.id).toBe(index + 1)
            expect(item.value).toBe(index + 1)
            expect(item.odd).toBe(index % 2 === 0 ? undefined : "odd")
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        })
    })
})