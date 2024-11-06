import "fake-indexeddb/auto"
import { upgradeDatabase } from "../upgrade"
import { deleteDatabase } from "../indexed"
import { storeCursorAction, indexCursorAction } from "../cursor"
import { getStoreIndexNames } from "../storeIndex"
import { getVersion } from "./base"

type Store = { id: number, value: number, odd?: string, re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("objectStore cursor", () => {
    it("create database and store", async () => {
        expect(await getVersion(databaseName)).toBe(0)
        await upgradeDatabase(databaseName, 1, (database) => {
            const objectStore = database.createObjectStore(storeName, {
                keyPath: "id",
                autoIncrement: true
            })
            for (let i = 1; i <= 100; i++) {
                const odd = i % 2 === 0 ? { odd: "odd" } : {}
                objectStore.add(Object.assign({ value: i, re10: i % 10 }, odd))
            }
        })
        expect(await getVersion(databaseName)).toBe(1)
    })
    it("check cursor", async () => {
        const result = await storeCursorAction<Store>(databaseName, storeName, (store: Store) => {
            return store.re10 > 0 && !store.odd
        })
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(50)
        for (let i = 0; i < 50; i++) {
            const item = result[i]
            const re10 = i % 5 * 2 + 1
            const value = Math.floor(i / 5) * 10 + re10
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(undefined)
            expect(item.re10).toBe(re10)
        }
    })
    it("check cursor query", async () => {
        const result = await storeCursorAction<Store>(databaseName, storeName, (store: Store) => {
            return store.re10 > 0 && !store.odd
        }, {
            query: IDBKeyRange.bound(1, 50)
        })
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(25)
        for (let i = 0; i < 25; i++) {
            const item = result[i]
            const re10 = i % 5 * 2 + 1
            const value = Math.floor(i / 5) * 10 + re10
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(undefined)
            expect(item.re10).toBe(re10)
        }
    })
    it("check cursor direction", async () => {
        const result = await storeCursorAction<Store>(databaseName, storeName, (store: Store) => {
            return store.re10 > 0 && !store.odd
        }, {
            direction: "prev"
        })
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(50)
        for (let i = 0; i < 50; i++) {
            const item = result[i]
            const re10 = 10 - (i % 5 * 2 + 1)
            const value = 100 - (Math.floor(i / 5) + 1) * 10 + re10
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(undefined)
            expect(item.re10).toBe(re10)
        }
    })
    it("check cursor query direction", async () => {
        const result = await storeCursorAction<Store>(databaseName, storeName, (store: Store) => {
            return store.re10 > 0 && !store.odd
        }, {
            query: IDBKeyRange.bound(51, 100),
            direction: "prev"
        })
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(25)
        for (let i = 0; i < 25; i++) {
            const item = result[i]
            const re10 = 10 - (i % 5 * 2 + 1)
            const value = 100 - (Math.floor(i / 5) + 1) * 10 + re10
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(undefined)
            expect(item.re10).toBe(re10)
        }
    })
    it("delete databse", async () => {
        await deleteDatabase(databaseName)
        expect(await getVersion(databaseName)).toBe(0)
    })
})

describe("odd index cursor", () => {
    it("create database and store", async () => {
        expect(await getVersion(databaseName)).toBe(0)
        await upgradeDatabase(databaseName, 1, (database) => {
            const objectStore = database.createObjectStore(storeName, {
                keyPath: "id",
                autoIncrement: true
            })
            objectStore.createIndex("odd", "odd", { unique: false })
            objectStore.createIndex("re10", "re10", { unique: false })
            for (let i = 1; i <= 100; i++) {
                const odd = i % 2 === 0 ? { odd: "odd" } : {}
                objectStore.add(Object.assign({ value: i, re10: i % 10 }, odd))
            }
        })
        expect(await getVersion(databaseName)).toBe(1)
        expect(await getStoreIndexNames(databaseName, storeName)).toEqual(["odd", "re10"])
    })
    it("check cursor", async () => {
        const result = await indexCursorAction<Store>(databaseName, storeName, "odd", (store: Store) => {
            return store.re10 > 0
        })
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(40)
        for (let i = 0; i < 40; i++) {
            const item = result[i]
            const re10 = (i % 4 + 1) * 2
            const value = Math.floor(i / 4) * 10 + re10
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(re10)
        }
    })
    it("check cursor direction", async () => {
        const result = await indexCursorAction<Store>(databaseName, storeName, "odd", (store: Store) => {
            return store.re10 > 0
        }, {
            direction: "prev"
        })
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(40)
        for (let i = 0; i < 40; i++) {
            const item = result[i]
            const re10 = 10 - (i % 4 + 1) * 2
            const value = 100 - (Math.floor(i / 4) + 1) * 10 + re10
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(re10)
        }
    })
    it("delete databse", async () => {
        await deleteDatabase(databaseName)
        expect(await getVersion(databaseName)).toBe(0)
    })
})

describe("re10 index cursor", () => {
    it("create database and store", async () => {
        expect(await getVersion(databaseName)).toBe(0)
        await upgradeDatabase(databaseName, 1, (database) => {
            const objectStore = database.createObjectStore(storeName, {
                keyPath: "id",
                autoIncrement: true
            })
            objectStore.createIndex("odd", "odd", { unique: false })
            objectStore.createIndex("re10", "re10", { unique: false })
            for (let i = 1; i <= 100; i++) {
                const odd = i % 2 === 0 ? { odd: "odd" } : {}
                objectStore.add(Object.assign({ value: i, re10: i % 10 }, odd))
            }
        })
        expect(await getVersion(databaseName)).toBe(1)
        expect(await getStoreIndexNames(databaseName, storeName)).toEqual(["odd", "re10"])
    })
    it("check cursor", async () => {
        const result = await indexCursorAction<Store>(databaseName, storeName, "re10", () => {
            return true
        })
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(100)
        for (let i = 0; i < 100; i++) {
            const item = result[i]
            const re10 = Math.floor(i / 10)
            const value = re10 === 0 ? (i + 1) * 10 : i % 10 * 10 + re10
            const odd = Math.floor(i / 10) % 2 === 0 ? "odd" : undefined
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(odd)
            expect(item.re10).toBe(re10)
        }
    })
    it("check cursor query", async () => {
        const result = await indexCursorAction<Store>(databaseName, storeName, "re10", () => {
            return true
        }, {
            query: IDBKeyRange.bound(4, 7)
        })
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(40)
        for (let i = 0; i < 40; i++) {
            const item = result[i]
            const re10 = Math.floor(i / 10) + 4
            const value = i % 10 * 10 + re10
            const odd = Math.floor(i / 10) % 2 === 0 ? "odd" : undefined
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(odd)
            expect(item.re10).toBe(re10)
        }
    })
    it("check cursor direction", async () => {
        const result = await indexCursorAction<Store>(databaseName, storeName, "re10", () => {
            return true
        }, {
            direction: "prev"
        })
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(100)
        for (let i = 0; i < 100; i++) {
            const item = result[i]
            const re10 = 9 - Math.floor(i / 10)
            const value = re10 === 0 ? (10 - i % 10) * 10 : (9 - i % 10) * 10 + re10
            const odd = Math.floor(i / 10) % 2 === 1 ? "odd" : undefined
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(odd)
            expect(item.re10).toBe(re10)
        }
    })
    it("check cursor query", async () => {
        const result = await indexCursorAction<Store>(databaseName, storeName, "re10", () => {
            return true
        }, {
            query: IDBKeyRange.bound(4, 7),
            direction: "prev"
        })
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(40)
        for (let i = 0; i < 40; i++) {
            const item = result[i]
            const re10 = 7 - Math.floor(i / 10)
            const value = (9 - i % 10) * 10 + re10
            const odd = Math.floor(i / 10) % 2 === 1 ? "odd" : undefined
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(odd)
            expect(item.re10).toBe(re10)
        }
    })
    it("delete databse", async () => {
        await deleteDatabase(databaseName)
        expect(await getVersion(databaseName)).toBe(0)
    })
})