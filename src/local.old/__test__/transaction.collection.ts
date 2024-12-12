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
    it("check collection insertOne insertMany", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async () => {
            const collection = indexed.collection<Store>(storeName)
            collection.create({ keyPath: "id", autoIncrement: true })
            for (let i = 1; i <= 50; i++) {
                const odd = i % 2 === 0 ? { odd: "odd" } : {}
                const id = await collection.insertOne(Object.assign({ value: i, re10: i % 10 }, odd))
                expect(id).toBe(i)
            }
            await collection.insertMany(new Array(50).fill(undefined).map((item, index) => {
                const value = index + 1 + 50
                const odd = value % 2 === 0 ? { odd: "odd" } : {}
                return Object.assign({
                    value: index + 1 + 50,
                    re10: value % 10
                }, odd)
            }))
        })
    })
    it("check collection findOne", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.transaction(async () => {
            const collection = indexed.collection<Store>(storeName)
            const count = await collection.count()
            expect(count).toBe(100)
            for (let i = 0; i < count; i++) {
                const value = i + 1
                const item = await collection.findOne(value)
                if (item) {
                    expect(item.id).toBe(value)
                    expect(item.value).toBe(value)
                    expect(item.odd).toBe(i % 2 === 1 ? "odd" : undefined)
                    expect(item.re10).toBe((i + 1) % 10)
                } else throw new Error("item should not be undefined")
            }
            for (let i = 0; i < count; i++) {
                const value = i + 1
                const item = await collection.findOne((item) => item.id === value)
                if (item) {
                    expect(item.id).toBe(value)
                    expect(item.value).toBe(value)
                    expect(item.odd).toBe(i % 2 === 1 ? "odd" : undefined)
                    expect(item.re10).toBe((i + 1) % 10)
                } else throw new Error("item should not be undefined")
            }
        })
    })
    it("check collection findMany", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.transaction(async () => {
            const collection = indexed.collection<Store>(storeName)
            const values = await collection.findMany()
            expect(values.length).toBe(100)
            values.forEach((item, index) => {
                const value = index + 1
                const odd = index % 2 === 0 ? undefined : "odd"
                const re10 = index % 10 + 1
                expect(item.id).toBe(value)
                expect(item.value).toBe(value)
                expect(item.odd).toBe(odd)
                expect(item.re10).toBe(re10 === 10 ? 0 : re10)
            })
            for (let i = 0; i < 10; i++) {
                const start = i * 10 + 1
                const range = IDBKeyRange.bound(start, start + 9)
                const values = await collection.findMany(range)
                expect(values.length).toBe(10)
                values.forEach((item, index) => {
                    const value = start + index
                    const odd = index % 2 === 0 ? undefined : "odd"
                    const re10 = index + 1
                    expect(item.id).toBe(value)
                    expect(item.value).toBe(value)
                    expect(item.odd).toBe(odd)
                    expect(item.re10).toBe(re10 === 10 ? 0 : re10)
                })
            }
            for (let i = 0; i < 10; i++) {
                const values = await collection.findMany((item) => item.re10 === i)
                expect(values.length).toBe(10)
                values.forEach((item, index) => {
                    const value = i === 0 ? (index + 1) * 10 : index * 10 + i
                    const odd = i % 2 === 1 ? undefined : "odd"
                    expect(item.id).toBe(value)
                    expect(item.value).toBe(value)
                    expect(item.odd).toBe(odd)
                    expect(item.re10).toBe(i)
                })
            }
        })
    })
    it("check collection count", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.transaction(async () => {
            const collection = indexed.collection<Store>(storeName)
            expect(await collection.count()).toBe(100)
            for (let i = 0; i < 20; i++) {
                expect(await collection.count(i + 1)).toBe(1)
            }
            for (let i = 0; i < 2; i++) {
                const start = (i + 2) * 10 + 1
                expect(await collection.count(IDBKeyRange.bound(start, start + 9))).toBe(10)
            }
            expect(await collection.count(() => true, { query: IDBKeyRange.bound(51, 100) })).toBe(50)
            expect(await collection.count((item) => item.odd === "odd")).toBe(50)
            for (let i = 0; i < 10; i++) {
                expect(await collection.count((item) => item.re10 === i)).toBe(10)
            }
        })
    })
    it("check collection updateOne updateMany", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.transaction(async () => {
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
        await indexed.transaction(async () => {
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
    it("check collection removeOne removeMany", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.transaction(async () => {
            const collection = indexed.collection<Store>(storeName)
            expect(await collection.count()).toBe(100)
            for (let i = 0; i < 30; i++) {
                expect(await collection.removeOne((item) => {
                    return item.id === i + 1 + 20
                })).toBe(1)
            }
            expect(await collection.count()).toBe(70)
            for (let i = 0; i < 20; i++) {
                expect(await collection.removeOne(i + 1)).toBe(1)
            }
            expect(await collection.count()).toBe(50)
            expect(await collection.removeMany(IDBKeyRange.bound(51, 70))).toBe(undefined)
            expect(await collection.count()).toBe(30)
            expect(await collection.removeMany(() => true)).toBe(30)
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