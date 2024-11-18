import "fake-indexeddb/auto"
import localIndexed from "../index"

type Store = { id: number, value: number, odd?: "odd", re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("check collection", () => {
    it("check upgrade", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(1, (event) => {
            const store = event.collection(storeName)
            store.create({ keyPath: "id", autoIncrement: false })
        })
        expect(await indexed.version()).toBe(1)
        expect(await indexed.stores()).toEqual([storeName])
    })
    it("check insertOne", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        for (let i = 1; i <= 10; i++) {
            const odd = i % 2 === 0 ? { odd: "odd" } : {}
            const item = Object.assign({ id: i, value: i, re10: i % 10 }, odd)
            expect(await store.insertOne<number>(item)).toBe(i)
        }
        const result = await store.find()
        expect(result.length).toBe(10)
        for (let i = 0; i < 10; i++) {
            const item = result[i]
            const value = i + 1
            const odd = i % 2 === 1 ? "odd" : undefined
            const re10 = i + 1
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(odd)
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        }
    })
    it("check insertMany", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        const ids = await store.insertMany(new Array(90).fill(undefined).map((item, index) => {
            const value = index + 11
            const odd = value % 2 === 0 ? { odd: "odd" } : {}
            return Object.assign({ id: value, value, re10: value % 10 }, odd)
        }))
        expect(ids.length).toBe(90)
        ids.forEach((id, index) => expect(id).toBe(index + 11))
        const result = await store.find()
        expect(result.length).toBe(100)
        for (let i = 0; i < 100; i++) {
            const item = result[i]
            const value = i + 1
            const odd = i % 2 === 1 ? "odd" : undefined
            const re10 = i % 10 + 1
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(odd)
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        }
    })
    it("check find", async () => {
        const indexed = localIndexed(databaseName)
        const collection = indexed.collection<Store>(storeName)
        const results = await collection.find((item) => item.odd === "odd")
        expect(results.length).toBe(50)
        for (let i = 0; i < results.length; i++) {
            const item = results[i]
            const value = (i + 1) * 2
            const re10 = ((i % 5) + 1) * 2
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        }
    })
    it("check findOne", async () => {
        const indexed = localIndexed(databaseName)
        const collection = indexed.collection<Store>(storeName)
        for (let i = 0; i < 100; i++) {
            const value = i + 1
            const odd = i % 2 === 1 ? "odd" : undefined
            const re10 = i % 10 + 1
            const result = await collection.findOne((item) => {
                return item.id === value
            })
            if (result) {
                expect(result.id).toBe(value)
                expect(result.value).toBe(value)
                expect(result.odd).toBe(odd)
                expect(result.re10).toBe(re10 === 10 ? 0 : re10)
            } else throw new Error("result should not be undefined")
        }
        expect(await collection.findOne((item) => {
            return item.id === 101
        })).toBe(undefined)
    })
    it("check delete database", async () => {
        await localIndexed.deleteDatabase(databaseName)
        const indexed = localIndexed(databaseName)
        expect(await indexed.version()).toBe(0)
        expect(await localIndexed.databases()).toEqual([])
    })
})