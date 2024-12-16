import "fake-indexeddb/auto"
import localIndexed from "../../src/indexed"

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
    it("check count", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        expect(await store.find(() => true).count()).toBe(100)
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
    it("check count odd", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        expect(await store.find(() => true, { sort: "odd" }).count()).toBe(50)
        expect(await store.find((item) => item.id > 50, { sort: "odd" }).count()).toBe(25)
        for (let i = 0; i < 5; i++) {
            expect(await store.find((item) => {
                return item.re10 ===  i * 2
            }, { sort: "odd" }).count()).toBe(10)
        }
    })
    it("check count re10", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        expect(await store.find(() => true, { sort: "re10" }).count()).toBe(100)
        expect(await store.find(() => true, { sort: "re10", order: "next" }).count()).toBe(100)
        expect(await store.find(() => true, { sort: "re10", order: "prev" }).count()).toBe(100)
        expect(await store.find(() => true, { sort: "re10", order: "nextunique" }).count()).toBe(10)
        expect(await store.find(() => true, { sort: "re10", order: "prevunique" }).count()).toBe(10)
        for (let i = 0; i < 10; i++) {
            expect(await store.find((item) => item.re10 === i, { sort: "re10" }).count()).toBe(10)
            expect(await store.find((item) => item.re10 === i, { sort: "re10", order: "next" }).count()).toBe(10)
            expect(await store.find((item) => item.re10 === i, { sort: "re10", order: "prev" }).count()).toBe(10)
            expect(await store.find((item) => item.re10 === i, { sort: "re10", order: "nextunique" }).count()).toBe(1)
            expect(await store.find((item) => item.re10 === i, { sort: "re10", order: "prevunique" }).count()).toBe(1)
        }
    })
})