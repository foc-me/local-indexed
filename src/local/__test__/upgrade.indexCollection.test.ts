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
    it("check upgrade", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async () => {
            const collection = indexed.collection<Store>(storeName)
            collection.create({ keyPath: "id", autoIncrement: true })
            collection.createIndex("odd", { unique: false })
            collection.createIndex("re10", { unique: false })
            for (let i = 1; i <= 100; i++) {
                const odd = i % 2 === 0 ? { odd: "odd" } : {}
                const id = await collection.insertOne(Object.assign({ value: i, re10: i % 10 }, odd))
                expect(id).toBe(i)
            }
            expect(await collection.count()).toBe(100)
            expect(await collection.count(item => item.odd === "odd")).toBe(50)
            const indexes = await collection.getIndexes()
            expect(indexes.length).toBe(2)
            expect(indexes.map(item => item.name)).toEqual(["odd", "re10"])

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
    it("check collection updateOne updateMany abort", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async () => {
            const collection = indexed.collection<Store>(storeName)

            const odd = collection.index("odd")
            const ids = new Array(50).fill(undefined).map((item, index) => {
                return (index + 1) * 2
            })
            expect(await odd.updateMany((item) => {
                return { id: item.id, value: item.value * 10, odd: "odd", re10: 0 }
            })).toEqual(ids)

            const re = collection.index("re10")
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 2; j++) {
                    const id = i * 10 + j * 2 + 1
                    expect(await re.updateOne((item) => {
                        if (item.id === id) {
                            return { id: item.id, value: item.value * 10, odd: "odd", re10: 0 }
                        }
                    })).toBe(id)
                }
            }
            for (let j = 0; j < 3; j++) {
                const re10 = (j + 2) * 2 + 1
                const ids = new Array(10).fill(undefined).map((item, index) => {
                    return index * 10 + re10
                })
                expect(await re.updateMany((item) => {
                    if (item.re10 === re10) {
                        return { id: item.id, value: item.value * 10, odd: "odd", re10: 0 }
                    }
                })).toEqual(ids)
            }

            const items = await collection.findMany()
            expect(items.length).toBe(100)
            for (let i = 0; i < items.length; i++) {
                const item = items[i]
                expect(item.id).toBe(i + 1)
                expect(item.value).toBe((i + 1) * 10)
                expect(item.odd).toBe("odd")
                expect(item.re10).toBe(0)
            }

            indexed.abort()
        })
    })
    it("check collection count", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async () => {
            const collection = indexed.collection<Store>(storeName)
            const odd = collection.index("odd")
            expect(await odd.count()).toBe(50)
            const re = collection.index("re10")
            expect(await re.count()).toBe(100)
            for (let i = 0; i < 10; i++) {
                expect(await re.count(i)).toBe(10)
            }
            for (let i = 0; i < 10; i++) {
                const range = IDBKeyRange.bound(i, 9)
                expect(await re.count(range)).toBe(100 - i * 10)
            }
            for (let i = 0; i < 10; i++) {
                expect(await re.count((item) => item.re10 === i)).toBe(10)
            }
        })
    })
    it("check collection findOne findMany", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async () => {
            const collection = indexed.collection<Store>(storeName)
            const odd = collection.index("odd")
            const oddItems = await odd.findMany()
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

            const re = collection.index("re10")
            for (let i = 0; i < 10; i++) {
                const item = await re.findOne(i)
                if (item) {
                    expect(item.id).toBe(i === 0 ? 10 : i)
                    expect(item.value).toBe(i === 0 ? 10 : i)
                    expect(item.odd).toBe(i % 2 === 1 ? undefined : "odd")
                    expect(item.re10).toBe(i)
                } else throw new Error("item should not be undefined")
            }
            for (let i = 0; i < 10; i++) {
                const item = await re.findOne((item) => item.re10 === i)
                if (item) {
                    expect(item.id).toBe(i === 0 ? 10 : i)
                    expect(item.value).toBe(i === 0 ? 10 : i)
                    expect(item.odd).toBe(i % 2 === 1 ? undefined : "odd")
                    expect(item.re10).toBe(i)
                } else throw new Error("item should not be undefined")
            }
            for (let i = 0; i < 10; i++) {
                const items = await re.findMany(i)
                expect(items.length).toBe(10)
                for (let j = 0; j < items.length; j++) {
                    const item = items[j]
                    const value = i === 0 ? (j + 1) * 10 : j * 10 + i
                    expect(item.id).toBe(value)
                    expect(item.value).toBe(value)
                    expect(item.odd).toBe(i !== 0 && i % 2 === 1 ? undefined : "odd")
                    expect(item.re10).toBe(i)
                }
            }
            for (let i = 0; i < 10; i++) {
                const items = await re.findMany(IDBKeyRange.bound(i, i))
                expect(items.length).toBe(10)
                for (let j = 0; j < items.length; j++) {
                    const item = items[j]
                    const value = i === 0 ? (j + 1) * 10 : j * 10 + i
                    expect(item.id).toBe(value)
                    expect(item.value).toBe(value)
                    expect(item.odd).toBe(i !== 0 && i % 2 === 1 ? undefined : "odd")
                    expect(item.re10).toBe(i)
                }
            }
            for (let i = 0; i < 10; i++) {
                const items = await re.findMany((item) => item.re10 === i)
                expect(items.length).toBe(10)
                for (let j = 0; j < items.length; j++) {
                    const item = items[j]
                    const value = i === 0 ? (j + 1) * 10 : j * 10 + i
                    expect(item.id).toBe(value)
                    expect(item.value).toBe(value)
                    expect(item.odd).toBe(i !== 0 && i % 2 === 1 ? undefined : "odd")
                    expect(item.re10).toBe(i)
                }
            }
        })
    })
    it("check collection removeOne removeMany", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async () => {
            const collection = indexed.collection<Store>(storeName)

            const odd = collection.index("odd")
            expect(await odd.removeMany((item) => true)).toBe(50)
            expect(await collection.count()).toBe(50)

            const re = collection.index("re10")
            for (let i = 0; i < 10; i++) {
                expect(await re.removeOne(item => item.re10 === 1)).toBe(1)
            }
            expect(await collection.count()).toBe(40)
            for (let i = 0; i < 4; i++) {
                expect(await re.removeMany(item => item.re10 === (i + 2) * 2 - 1)).toBe(10)
            }
            expect(await collection.count()).toBe(0)
        })
    })
    it("delete database", async () => {
        await localIndexed.deleteDatabase(databaseName)
        const indexed = localIndexed(databaseName)
        expect(await indexed.version()).toBe(0)
        expect((await localIndexed.databases()).length).toEqual(0)
        expect(await localIndexed.exists(databaseName)).toBe(false)
    })
})