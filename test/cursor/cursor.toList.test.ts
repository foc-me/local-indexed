import "fake-indexeddb/auto"
import localIndexed from "../../src/indexed"

type Store = { id: number, value: number, odd?: "odd", re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("create indexed", () => {
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
})

describe("check toList", () => {
    it("check toList default", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        const items = await store.find(() => true).toList()
        expect(items.length).toBe(100)
        items.forEach((item, index) => {
            const re10 = index % 10 + 1
            expect(item.id).toBe(index + 1)
            expect(item.value).toBe(index + 1)
            expect(item.odd).toBe(index % 2 === 0 ? undefined : "odd")
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        })
        for (let i = 0; i < 10; i++) {
            const start = i * 10 + 1
            const end = start + 9
            const items = await store.find((item) => {
                return item.id >= start && item.id <= end
            }).toList()
            expect(items.length).toBe(10)
            items.forEach((item, index) => {
                const re10 = index + 1
                expect(item.id).toBe(start + index)
                expect(item.value).toBe(start + index)
                expect(item.odd).toBe(index % 2 === 0 ? undefined : "odd")
                expect(item.re10).toBe(re10 === 10 ? 0 : re10)
            })
        }
        const odds = await store.find((item) => item.odd === "odd").toList()
        expect(odds.length).toBe(50)
        odds.forEach((item, index) => {
            const value = (index + 1) * 2
            const re10 = (index % 5 + 1) * 2
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        })
        for (let i = 0; i < 10; i++) {
            const items = await store.find((item) => {
                return item.re10 === i
            }).toList()
            expect(items.length).toBe(10)
            items.forEach((item, index) => {
                const value = i === 0 ? (index + 1) * 10 : index * 10 + i
                expect(item.id).toBe(value)
                expect(item.value).toBe(value)
                expect(item.odd).toBe(i % 2 === 1 ? undefined : "odd")
                expect(item.re10).toBe(i)
            })
        }
    })
})