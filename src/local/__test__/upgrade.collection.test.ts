import "fake-indexeddb/auto"
import localIndexed from "../index"

type Store = { id: number, value: number, odd?: "odd", re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("check indexed.upgrade with collection", () => {
    it("no database", async () => {
        const indexed = localIndexed(databaseName)
        expect(await indexed.version()).toBe(0)
        expect((await localIndexed.databases()).length).toEqual(0)
    })
    it("check collection insertOne count getIndexes findMany", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async () => {
            const collection = indexed.collection<Store>(storeName)
            collection.create({ keyPath: "id", autoIncrement: true })
            for (let i = 1; i <= 100; i++) {
                const odd = i % 2 === 0 ? { odd: "odd" } : {}
                const id = await collection.insertOne(Object.assign({ value: i, re10: i % 10 }, odd))
                expect(id).toBe(i)
            }
            expect(await collection.count()).toBe(100)
            expect(await collection.count(item => item.odd === "odd")).toBe(50)
            expect((await collection.getIndexes()).length).toBe(0)

            const items = await collection.findMany()
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
    })
    it("check collection alter findMany insertMany", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async () => {
            const collection = indexed.collection<Store>(storeName)
            const items = await collection.findMany()
            expect(items.length).toBe(100)
            collection.alter({ keyPath: "id", autoIncrement: true })
            const ids = await collection.insertMany(items)
            expect(ids.length).toBe(100)
            ids.forEach((id, index) => {
                expect(id).toBe(index + 1)
            })

            for (let i = 0; i < 20; i++) {
                const value = i + 1
                const oneItems = await collection.findMany(value)
                expect(oneItems.length).toBe(1)
                expect(oneItems[0].id).toBe(value)
                expect(oneItems[0].value).toBe(value)
                expect(oneItems[0].odd).toBe(i % 2 === 1 ? "odd" : undefined)
                expect(oneItems[0].re10).toBe((i + 1) % 10)
            }

            const checkItems = await collection.findMany(IDBKeyRange.bound(1, 50))
            expect(checkItems.length).toBe(50)
            for (let i = 0; i < checkItems.length; i++) {
                const item = checkItems[i]
                const value = i + 1
                expect(item.id).toBe(value)
                expect(item.value).toBe(value)
                expect(item.odd).toBe(i % 2 === 1 ? "odd" : undefined)
                expect(item.re10).toBe((i + 1) % 10)
            }
        })
    })
    it("check collection createIndex indexes index", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async () => {
            const collection = indexed.collection<Store>(storeName)
            collection.createIndex("odd", { unique: false })
            collection.createIndex("re10", { unique: false })
            const indexes = await collection.getIndexes()
            expect(indexes.length).toBe(2)
            expect(indexes.map(item => item.name)).toEqual(["odd", "re10"])

            const oddCollection = collection.index("odd")
            const oddItems = await oddCollection.findMany()
            expect(oddItems.length).toBe(50)
            for (let i = 0; i < oddItems.length; i++) {
                const item = oddItems[i]
                const value = (i + 1) * 2
                const re10 = (i % 5 + 1) * 2
                expect(item.id).toBe(value)
                expect(item.value).toBe(value)
                expect(item.odd).toBe("odd")
                expect(item.re10).toBe(re10 === 10 ? 0 : re10)
            }

            const reCollection = collection.index("re10")
            const reItems = await reCollection.findMany()
            expect(reItems.length).toBe(100)
            for (let i = 0; i < reItems.length; i++) {
                const item = reItems[i]
                const re10 = i < 10 ? 0 : Math.floor(i / 10)
                const value = i < 10 ? (i + 1) * 10 : i % 10 * 10 + re10
                const odd = i < 10 ? "odd" : (Math.floor(i / 10) % 2 === 1 ? undefined : "odd")
                expect(item.id).toBe(value)
                expect(item.value).toBe(value)
                expect(item.odd).toBe(odd)
                expect(item.re10).toBe(re10)
            }
        })
    })
    it("check collection updateOne updateMany", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async () => {
            const collection = indexed.collection<Store>(storeName)
            for (let i = 0; i < 20; i++) {
                const id = i + 1
                expect(await collection.updateOne({ id, value: id * 10, odd: "odd", re10: 0 })).toBe(id)
            }
            for (let i = 0; i < 30; i++) {
                const id = i + 1 + 20
                expect(await collection.updateOne((item) => {
                    if (item.id === id) {
                        return { id: item.id, value: item.value * 10, odd: "odd", re10: 0 }
                    }
                })).toBe(id)
            }
            for (let i = 0; i < 2; i++) {
                const start = i * 10 + 1 + 50
                const query = IDBKeyRange.bound(start, start + 9)
                const ids = await collection.updateMany((item) => {
                    return { id: item.id, value: item.value * 10, odd: "odd", re10: 0 }
                }, { query })
                expect(ids.length).toBe(10)
                ids.forEach((id, index) => {
                    expect(id).toBe(start + index)
                })
            }
            const ids = await collection.updateMany(new Array(10).fill(undefined).map((item, index) => {
                const id = index + 1 + 70
                return { id, value: id * 10, odd: "odd", re10: 0 }
            }))
            expect(ids.length).toBe(10)
            ids.forEach((id, index) => {
                expect(id).toBe(index + 1 + 70)
            })
            const lastIds = await collection.updateMany((item) => {
                return { id: item.id, value: item.value * 10, odd: "odd", re10: 0 }
            }, { query: IDBKeyRange.bound(81, 100) })
            expect(lastIds.length).toBe(20)
            lastIds.forEach((id, index) => {
                expect(id).toBe(index + 1 + 80)
            })
        })
    })
    it("check abort", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async () => {
            const collection = indexed.collection<Store>(storeName)
            const ids = await collection.updateMany((item) => {
                const value = Math.floor(item.value / 10)
                const odd = value % 2 === 0 ? { odd: "odd" } : {}
                return Object.assign({ id: item.id, value, re10: value % 10 }, odd)
            })
            expect(ids.length).toBe(100)
            ids.forEach((id, index) => {
                expect(id).toBe(index + 1)
            })

            const items = await collection.findMany()
            expect(items.length).toBe(100)
            for (let i = 0; i < items.length; i++) {
                const item = items[i]
                const value = i + 1
                expect(item.id).toBe(value)
                expect(item.value).toBe(value)
                expect(item.odd).toBe(i % 2 === 1 ? "odd" : undefined)
                expect(item.re10).toBe((i + 1) % 10)
            }
            indexed.abort()
        })

        const collection = indexed.collection<Store>(storeName)
        const items = await collection.findMany()
        expect(items.length).toBe(100)
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            expect(item.id).toBe(i + 1)
            expect(item.value).toBe((i + 1) * 10)
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