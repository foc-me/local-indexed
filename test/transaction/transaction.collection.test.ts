import "fake-indexeddb/auto"
import localIndexed from "../../src/indexed"

type Store = { id: number, value: number, odd?: "odd", re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("check indexed transaction collection", () => {
    it("check create", async () => {
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
        })).toBe(undefined)
    })
    it("check error", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection(storeName)
        expect(await indexed.transaction(async () => {
            expect(() => store.create()).toThrow(Error)
            expect(() => store.create()).toThrow("collection.create requires upgrade")
            expect(() => store.drop()).toThrow(Error)
            expect(() => store.drop()).toThrow("collection.drop requires upgrade")
            expect(() => store.alter()).toThrow(Error)
            expect(() => store.alter()).toThrow("collection.alter requires upgrade")
            expect(() => store.createIndex("odd")).toThrow(Error)
            expect(() => store.createIndex("odd")).toThrow("collection.createIndex requires upgrade")
            expect(() => store.dropIndex("odd")).toThrow(Error)
            expect(() => store.dropIndex("odd")).toThrow("collection.dropIndex requires upgrade")
        })).toBe(undefined)
    })
    it("check insert", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection(storeName)
        expect(await indexed.transaction(async () => {
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
    })
    it("check find", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        expect(await indexed.transaction(async () => {
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
    })
        it("check abort", async () => {
            const indexed = localIndexed(databaseName)
            const store = indexed.collection<Store>(storeName)
            expect(await indexed.transaction(async () => {
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
        expect(await indexed.transaction(async () => {
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
        expect(await indexed.transaction(async () => {
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
        expect((await store.find()).length).toBe(0)
    })
})