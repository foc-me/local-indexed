import "fake-indexeddb/auto"
import localIndexed from "../../src/indexed"

type Store = { id: number, value: number, odd?: "odd", re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("check indexed cursor", () => {
    it("check create", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(async () => {
            const store = indexed.collection(storeName)
            store.create({ keyPath: "id", autoIncrement: true })
            store.createIndex("odd", { unique: false })
            store.createIndex("re10", { unique: false })
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
        expect(await indexed.upgrade(async () => {
            expect(await store.find(() => true).count()).toBe(100)
            for (let i = 0; i < 20; i++) {
                expect(await store.find(item => item.id === i + 1).count()).toBe(1)
            }
            for (let i = 0; i < 3; i++) {
                const start = 20 + i * 10 + 1
                const end = start + 9
                expect(await store.find(item => item.id >= start && item.id <= end).count()).toBe(10)
            }
            expect(await store.find(item => item.id >= 51).count()).toBe(50)

            expect(await store.find({ sort: "odd" }).count()).toBe(50)
            expect(await store.find({ filter: (item) => item.id > 50, sort: "odd" }).count()).toBe(25)
            for (let i = 0; i < 5; i++) {
                expect(await store.find({ filter: (item) => item.re10 ===  i * 2, sort: "odd" }).count()).toBe(10)
            }

            expect(await store.find({ sort: "re10" }).count()).toBe(100)
            expect(await store.find({ sort: "re10", order: "next" }).count()).toBe(100)
            expect(await store.find({ sort: "re10", order: "prev" }).count()).toBe(100)
            expect(await store.find({ sort: "re10", order: "nextunique" }).count()).toBe(10)
            expect(await store.find({ sort: "re10", order: "prevunique" }).count()).toBe(10)
            for (let i = 0; i < 10; i++) {
                expect(await store.find({ filter: (item) => item.re10 === i, sort: "re10" }).count()).toBe(10)
                expect(await store.find({ filter: (item) => item.re10 === i, sort: "re10", order: "next" }).count()).toBe(10)
                expect(await store.find({ filter: (item) => item.re10 === i, sort: "re10", order: "prev" }).count()).toBe(10)
                expect(await store.find({ filter: (item) => item.re10 === i, sort: "re10", order: "nextunique" }).count()).toBe(1)
                expect(await store.find({ filter: (item) => item.re10 === i, sort: "re10", order: "prevunique" }).count()).toBe(1)
            }
        })).toBe(undefined)
        expect(await indexed.version()).toBe(2)
    })
    it("check toList", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        expect(await indexed.upgrade(async () => {
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
                const count = i * 10
                expect((await store.find(() => true).toList(count)).length).toBe(count)
                expect((await store.find(() => true).toList(undefined, count)).length).toBe(100 - count)
            }
            for (let i = 0; i < 10; i++) {
                expect((await store.find((item) => item.re10 === i).toList(20)).length).toBe(10)
                expect((await store.find((item) => item.re10 === i).toList(undefined, 20)).length).toBe(0)
            }
        })).toBe(undefined)
        expect(await indexed.version()).toBe(3)
    })
    it("check update abort", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection<Store>(storeName)
        expect(await indexed.upgrade(async () => {
            const ids = await store.find(() => true).update((item) => {
                const value = item.value * 10
                return { id: item.id, value, odd: "odd", re10: 0 }
            })
            expect(ids.length).toBe(100)
            ids.forEach((id, index) => expect(id).toBe(index + 1))
            const items = await store.find(() => true).toList()
            expect(items.length).toBe(100)
            items.forEach((item, index) => {
                expect(item.id).toBe(index + 1)
                expect(item.value).toBe((index + 1) * 10)
                expect(item.odd).toBe("odd")
                expect(item.re10).toBe(0)
            })
            indexed.abort()
        })).toBe(undefined)
        expect(await indexed.version()).toBe(3)

        const items = await store.find(() => true).toList()
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
            const ids = await store.find(() => true).update((item) => {
                const value = item.value * 10
                return { id: item.id, value, odd: "odd", re10: 0 }
            })
            expect(ids.length).toBe(100)
            ids.forEach((id, index) => expect(id).toBe(index + 1))
        })).toBe(undefined)
        expect(await indexed.version()).toBe(4)

        const items = await store.find(() => true).toList()
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
            expect(await store.find(() => true).remove()).toBe(100)
        })).toBe(undefined)
        expect(await indexed.version()).toBe(5)
        expect((await store.find()).length).toBe(0)
    })
})