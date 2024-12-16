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
        const oddItems = await store.find((item) => item.odd === "odd").toList()
        expect(oddItems.length).toBe(50)
        oddItems.forEach((item, index) => {
            const value = (index + 1) * 2
            const re10 = (index % 5 + 1) * 2
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        })
        for (let i = 0; i < 10; i++) {
            const items = await store.find((item) => item.re10 === i).toList()
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
    it("check toList limit", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        expect((await store.find(() => true).toList(-1)).length).toBe(0)
        for (let i = 0; i < 10; i++) {
            const count = (i + 1) * 10
            expect((await store.find(() => true).toList(count)).length).toBe(count)
            expect((await store.find(() => true).toList(undefined, count)).length).toBe(100 - count)
        }
        for (let i = 0; i < 10; i++) {
            const count = (i + 1) * 5
            expect((await store.find(item => item.odd === "odd").toList(count)).length).toBe(count)
            expect((await store.find(item => item.odd === "odd").toList(undefined, count)).length).toBe(50 - count)
        }
        for (let i = 0; i < 10; i++) {
            expect((await store.find(item => item.re10 === i).toList(20)).length).toBe(10)
            expect((await store.find(item => item.re10 === i).toList(undefined, 20)).length).toBe(0)
        }
    })
    it("check toList direction", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        expect((await store.find(() => true, { order: "nextunique" }).toList()).length).toBe(100)
        expect((await store.find(() => true, { order: "prevunique" }).toList()).length).toBe(100)
        const items = await store.find(() => true, { order: "prev" }).toList()
        expect(items.length).toBe(100)
        items.forEach((item, index) => {
            const value = 100 - index
            const re10 = 10 - index % 10
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(index % 2 === 1 ? undefined : "odd")
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        })
        const oddItems = await store.find((item) => item.odd === "odd", { order: "prev" }).toList()
        expect(oddItems.length).toBe(50)
        oddItems.forEach((item, index) => {
            const value = 100 - index * 2
            const re10 = 10 - index % 5 * 2
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        })
        for (let i = 0; i < 10; i++) {
            const items = await store.find((item) => item.re10 === i, { order: "prev" }).toList()
            expect(items.length).toBe(10)
            items.forEach((item, index) => {
                const value = i === 0 ? 100 - index * 10 : (10 - index - 1) * 10 + i
                expect(item.id).toBe(value)
                expect(item.value).toBe(value)
                expect(item.odd).toBe(i % 2 === 1 ? undefined : "odd")
                expect(item.re10).toBe(i)
            })
        }
    })
    it("check toList direction limit", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        expect((await store.find(() => true, { order: "nextunique" }).toList(-1)).length).toBe(0)
        expect((await store.find(() => true, { order: "prevunique" }).toList(-1)).length).toBe(0)
        for (let i = 0; i < 10; i++) {
            const count = (i + 1) * 10
            expect((await store.find(() => true, { order: "prev" }).toList(count)).length).toBe(count)
            expect((await store.find(() => true, { order: "prev" }).toList(undefined, count)).length).toBe(100 - count)
        }
        for (let i = 0; i < 10; i++) {
            const count = (i + 1) * 5
            expect((await store.find(item => item.odd === "odd", { order: "prev" }).toList(count)).length).toBe(count)
            expect((await store.find(item => item.odd === "odd", { order: "prev" }).toList(undefined, count)).length).toBe(50 - count)
        }
        for (let i = 0; i < 10; i++) {
            expect((await store.find(item => item.re10 === i, { order: "prev" }).toList(20)).length).toBe(10)
            expect((await store.find(item => item.re10 === i, { order: "prev" }).toList(undefined, 20)).length).toBe(0)
        }
    })
})

describe("check odd toList", () => {
    it("check toList", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        const items = await store.find(() => true, { sort: "odd" }).toList()
        expect(items.length).toBe(50)
        items.forEach((item, index) => {
            const value = (index + 1) * 2
            const re10 = (index % 5 + 1) * 2
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        })
        for (let i = 0; i < 5; i++) {
            const re10 = i * 2
            const items = await store.find((item) => item.re10 === re10, { sort: "odd" }).toList()
            expect(items.length).toBe(10)
            items.forEach((item, index) => {
                const value = i === 0 ? (index + 1) * 10 : index * 10 + re10
                expect(item.id).toBe(value)
                expect(item.value).toBe(value)
                expect(item.odd).toBe("odd")
                expect(item.re10).toBe(re10)
            })
        }
    })
    it("check tolist direction", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        const orders = ["nextunique", "prevunique"]
        for (let i = 0; i < orders.length; i++) {
            const order = orders[i] as IDBCursorDirection
            const items = await store.find(() => true, { sort: "odd", order }).toList()
            expect(items.length).toBe(1)
            if (order === "nextunique") {
                expect(items[0].id).toBe(2)
                expect(items[0].value).toBe(2)
                expect(items[0].odd).toBe("odd")
                expect(items[0].re10).toBe(2)
            } else {
                // why item id got 2 while set direction to prevunique ?
                expect(items[0].id).toBe(2)
                expect(items[0].value).toBe(2)
                expect(items[0].odd).toBe("odd")
                expect(items[0].re10).toBe(2)
            }
        }
        const items = await store.find(() => true, { sort: "odd", order: "prev" }).toList()
        expect(items.length).toBe(50)
        items.forEach((item, index) => {
            const value = 100 - index * 2
            const re10 = 10 - index % 5 * 2
            expect(item.id).toBe(value)
            expect(item.id).toBe(value)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        })
    })
    it("check toList direction limit", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        for (let i = 0; i < 10; i++) {
            expect((await store.find(() => true, { sort: "odd", order: "prev" }).toList(i * 5)).length).toBe(i * 5)
            expect((await store.find(() => true, { sort: "odd", order: "prev" }).toList(undefined, i * 5)).length).toBe(50 - (i * 5))
        }
        for (let i = 0; i < 5; i++) {
            expect((await store.find((item) => item.re10 === i * 2, { sort: "odd", order: "prev" }).toList(20)).length).toBe(10)
            expect((await store.find((item) => item.re10 === i * 2, { sort: "odd", order: "prev" }).toList(undefined, 20)).length).toBe(0)
        }
    })
})

describe("check re10 toList", () => {
    it("check toList", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        const items = await store.find(() => true, { sort: "re10" }).toList()
        expect(items.length).toBe(100)
        items.forEach((item, index) => {
            const re10 = Math.floor(index / 10)
            const value = re10 === 0 ? (index % 10 + 1) * 10 : index % 10 * 10 + re10
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(re10 % 2 === 1 ? undefined : "odd")
            expect(item.re10).toBe(re10)
        })
        const oddItems = await store.find((item) => item.odd === "odd", { sort: "re10" }).toList()
        expect(oddItems.length).toBe(50)
        oddItems.forEach((item, index) => {
            const re10 = Math.floor(index / 10) * 2
            const value = re10 === 0 ? (index % 10 + 1) * 10 : index % 10 * 10 + re10
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(re10)
        })
        for (let i = 0; i < 10; i++) {
            const items = await store.find((item) => item.re10 === i, { sort: "re10" }).toList()
            expect(items.length).toBe(10)
            items.forEach((item, index) => {
                const value = i === 0 ? (index % 10 + 1) * 10 : index % 10 * 10 + i
                expect(item.id).toBe(value)
                expect(item.value).toBe(value)
                expect(item.odd).toBe(i % 2 === 1 ? undefined : "odd")
                expect(item.re10).toBe(i)
            })
        }
    })
})