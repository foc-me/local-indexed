import "fake-indexeddb/auto"
import localIndexed from "../../src/indexed"

type Store = { id: number, value: number, odd?: "odd", re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("check indexed upgrade collection", () => {
    it("check create createIndex", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection(storeName)
        expect(await indexed.upgrade(async () => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
            expect(store.createIndex("odd", { unique: false })).toBe(true)
            expect(store.createIndex("re10", { unique: false })).toBe(true)
            const info = await store.info()
            expect(info.name).toBe(storeName)
            expect(info.keyPath).toBe("id")
            expect(info.autoIncrement).toBe(true)
            const indexes = Object.keys(info.indexes)
            expect(indexes.length).toBe(2)
            indexes.forEach((key) => {
                const index = info.indexes[key]
                expect(index.name).toBe(key)
                expect(index.keyPath).toBe(key)
                expect(index.unique).toBe(false)
                expect(index.multiEntry).toBe(false)
            })
        })).toBe(undefined)
        expect(await indexed.version()).toBe(1)
    })
    it("check dropIndex", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection(storeName)
        expect(await indexed.upgrade(async () => {
            expect(store.dropIndex("odd")).toBe(true)
            expect(store.dropIndex("re10")).toBe(true)
            const info = await store.info()
            expect(info.name).toBe(storeName)
            expect(info.keyPath).toBe("id")
            expect(info.autoIncrement).toBe(true)
            const indexes = Object.keys(info.indexes)
            expect(indexes.length).toBe(0)
        })).toBe(undefined)
        expect(await indexed.version()).toBe(2)
    })
    it("check alter", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection(storeName)
        expect(await indexed.upgrade(async () => {
            expect(store.alter({
                keyPath: "id",
                autoIncrement: true,
                indexes: {
                    odd: { unique: false },
                    re10: { unique: false }
                }
            })).toBe(true)
            const info = await store.info()
            expect(info.name).toBe(storeName)
            expect(info.keyPath).toBe("id")
            expect(info.autoIncrement).toBe(true)
            const indexes = Object.keys(info.indexes)
            expect(indexes.length).toBe(2)
            indexes.forEach((key) => {
                const index = info.indexes[key]
                expect(index.name).toBe(key)
                expect(index.keyPath).toBe(key)
                expect(index.unique).toBe(false)
                expect(index.multiEntry).toBe(false)
            })
        })).toBe(undefined)
        expect(await indexed.version()).toBe(3)
    })
    it("check insert", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection(storeName)
        expect(await indexed.upgrade(async () => {
            expect(await store.insert)
            for (let i = 0; i < 50; i++) {
                const value = i + 1
                const odd = value % 2 === 0 ? { odd: "odd" } : {}
                expect(await store.insert(Object.assign({ value, re10: value % 10 }, odd))).toBe(value)
            }
            const values = new Array(50).fill(undefined).map((item, index) => {
                const value = index + 50 + 1
                const odd = value % 2 === 0 ? { odd: "odd" } : {}
                return Object.assign({ value, re10: value % 10 }, odd)
            })
            const ids = await store.insert(values)
            expect(ids.length).toBe(50)
            ids.forEach((id, index) => expect(id).toBe(index + 50 + 1))
        })).toBe(undefined)
        expect(await indexed.version()).toBe(4)
    })
    it("check find", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        expect(await indexed.upgrade(async () => {
            const items = await store.find()
            expect(items.length).toBe(100)
            items.forEach((item, index) => {
                const re10 = index % 10 + 1
                expect(item.id).toBe(index + 1)
                expect(item.value).toBe(index + 1)
                expect(item.odd).toBe(index % 2 === 0 ? undefined : "odd")
                expect(item.re10).toBe(re10 === 10 ? 0 : re10)
            })
            const keys = new Array(100).fill(undefined).map((item, index) => index + 1)
            const listItems = await store.find(keys)
            expect(listItems.length).toBe(100)
            listItems.forEach((item, index) => {
                const re10 = index % 10 + 1
                expect(item.id).toBe(index + 1)
                expect(item.value).toBe(index + 1)
                expect(item.odd).toBe(index % 2 === 0 ? undefined : "odd")
                expect(item.re10).toBe(re10 === 10 ? 0 : re10)
            })
            const countListItems = await store.find(keys, 50)
            expect(countListItems.length).toBe(50)
            for (let i = 0; i < 100; i++) {
                const items = await store.find(i + 1)
                expect(items.length).toBe(1)
                const item = items[0]
                const re10 = i % 10 + 1
                expect(item.id).toBe(i + 1)
                expect(item.value).toBe(i + 1)
                expect(item.odd).toBe(i % 2 === 0 ? undefined : "odd")
                expect(item.re10).toBe(re10 === 10 ? 0 : re10)
                expect((await store.find(i + 1, 10)).length).toBe(1)
            }
            for (let i = 0; i < 10; i++) {
                const start = i * 10 + 1
                const range = IDBKeyRange.bound(start, start + 9)
                const items = await store.find(range)
                expect(items.length).toBe(10)
                items.forEach((item, index) => {
                    const re10 = index + 1
                    expect(item.id).toBe(start + index)
                    expect(item.value).toBe(start + index)
                    expect(item.odd).toBe(index % 2 === 0 ? undefined : "odd")
                    expect(item.re10).toBe(re10 === 10 ? 0 : re10)
                })
                expect((await store.find(range, 5)).length).toBe(5)
            }
        })).toBe(undefined)
        expect(await indexed.version()).toBe(5)
    })
    it("check abort", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        expect(await indexed.upgrade(async () => {
            for (let i = 0; i < 50; i++) {
                const value = (i + 1) * 10
                expect(await store.update({ id: i + 1, value, odd: "odd", re10: 0 })).toBe(i + 1)
            }
            const items = new Array(50).fill(undefined).map((item, index) => {
                const id = index + 1 + 50
                return { id, value: id * 10, odd: "odd", re10: 0 }
            })
            const ids = await store.update(items)
            expect(ids.length).toBe(50)
            ids.forEach((id, index) => expect(id).toBe(index + 1 + 50))
            indexed.abort()
        })).toBe(undefined)
        expect(await indexed.version()).toBe(5)

        const items = await store.find()
        expect(items.length).toBe(100)
        items.forEach((item, index) => {
            const re10 = index % 10 + 1
            expect(item.id).toBe(index + 1)
            expect(item.value).toBe(index + 1)
            expect(item.odd).toBe(index % 2 === 0 ? undefined : "odd")
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        })
    })
    it("check update", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        expect(await indexed.upgrade(async () => {
            for (let i = 0; i < 50; i++) {
                const value = (i + 1) * 10
                expect(await store.update({ id: i + 1, value, odd: "odd", re10: 0 })).toBe(i + 1)
            }
            const items = new Array(50).fill(undefined).map((item, index) => {
                const id = index + 1 + 50
                return { id, value: id * 10, odd: "odd", re10: 0 }
            })
            const ids = await store.update(items)
            expect(ids.length).toBe(50)
            ids.forEach((id, index) => expect(id).toBe(index + 1 + 50))
        })).toBe(undefined)
        expect(await indexed.version()).toBe(6)

        const items = await store.find()
        expect(items.length).toBe(100)
        items.forEach((item, index) => {
            expect(item.id).toBe(index + 1)
            expect(item.value).toBe((index + 1) * 10)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(0)
        })
    })
    it("check remove", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        expect(await indexed.upgrade(async () => {
            for (let i = 0; i < 20; i++) {
                expect(await store.remove(i + 1)).toBe(undefined)
            }
            expect((await store.find()).length).toBe(80)
            for (let i = 0; i < 3; i++) {
                const ids = new Array(10).fill(undefined).map((item, index) => {
                    return 20 + i * 10 + index + 1
                })
                expect(await store.remove(ids)).toBe(undefined)
            }
            expect((await store.find()).length).toBe(50)
            expect(await store.remove(IDBKeyRange.bound(51, 100)))
            expect((await store.find()).length).toBe(0)
        })).toBe(undefined)
        expect(await indexed.version()).toBe(7)
        expect((await store.find()).length).toBe(0)
    })
    it("check drop", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        expect(await indexed.upgrade(async () => {
            expect(store.drop()).toBe(true)
        })).toBe(undefined)
        expect(await indexed.version()).toBe(8)
        expect(await indexed.stores()).toEqual([])
    })
})