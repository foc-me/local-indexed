import "fake-indexeddb/auto"
import localIndexed from "../index"

type Store = { id: number, value: number, odd?: "odd", re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("check transaction", () => {
    it("check empty database", async () => {
        const indexed = localIndexed(databaseName)
        expect(await indexed.version()).toBe(0)
        expect((await localIndexed.databases()).length).toBe(0)
        expect(await localIndexed.exists(databaseName)).toBe(false)
    })
    it("check create", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(1, async () => {
            const collection = indexed.collection(storeName)
            collection.create({ keyPath: "id", autoIncrement: true })
            const ids: number[] = []
            for (let i = 1; i <= 100; i++) {
                const odd = i % 2 === 0 ? { odd: "odd" } : {}
                ids.push(await collection.insertOne(Object.assign({ id: i, value: i, re10: i % 10 }, odd)))
            }
            expect(ids.length).toBe(100)
            ids.forEach((id, index) => {
                expect(id).toBe(index + 1)
            })
        })
        const collection = indexed.collection<Store>(storeName)
        const result = await collection.findMany()
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(100)
        for (let i = 0; i < 100; i++) {
            const item = result[i]
            const value = i + 1
            const re10 = i % 10 + 1
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(i % 2 === 0 ? undefined : "odd")
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        }
    })
    it("check transaction", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.transaction(async () => {
            try {
                const collection = indexed.collection<Store>(storeName)
                const ids = await collection.updateMany<number>((item) => {
                    if (!item.odd) {
                        const value = item.value * 10
                        return { id: item.id, value, odd: "odd", re10: value % 10 }
                    }
                })
                expect(Array.isArray(ids)).toBe(true)
                expect(ids.length).toBe(50)
                ids.forEach((id, index) => {
                    expect(id).toBe(index * 2 + 1)
                })
                // test abort
                // throw new Error("abort")
                const count = await collection.removeMany((item) => {
                    return item.id > 50
                })
                expect(count).toBe(50)
            } catch (error) {
                indexed.abort()
            }
        })
        const collection = indexed.collection<Store>(storeName)
        const result = await collection.findMany()
        expect(result.length).toBe(50)
        for (let i = 0; i < result.length; i++) {
            const item = result[i]
            const value = i % 2 === 0 ? (i + 1) * 10 : i + 1
            const re10 = i % 2 === 0 ? 0 : i % 10 + 1
            expect(item.id).toBe(i + 1)
            expect(item.value).toBe(value)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        }
        // expect(result.length).toBe(100)
        // for (let i = 0; i < 100; i++) {
        //     const item = result[i]
        //     const value = i + 1
        //     const re10 = i % 10 + 1
        //     expect(item.id).toBe(value)
        //     expect(item.value).toBe(value)
        //     expect(item.odd).toBe(i % 2 === 0 ? undefined : "odd")
        //     expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        // }
    })
    it("check delete database", async () => {
        await localIndexed.deleteDatabase(databaseName)
        const indexed = localIndexed(databaseName)
        expect(await indexed.version()).toBe(0)
        expect(await localIndexed.databases()).toEqual([])
    })
})