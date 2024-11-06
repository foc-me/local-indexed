import "fake-indexeddb/auto"
import { deleteDatabase } from "../indexed"
import { getStoreIndexNames, indexAction } from "../storeIndex"
import { upgradeDatabase } from "../upgrade"
import { getVersion } from "./base"
import { storeAction } from "../store"

type Store = { id: number, value: number, odd?: string, re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("object store apis", () => {
    it("create database and store", async () => {
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
        expect(await storeAction(databaseName, storeName, (objectStore) => {
            return objectStore.count()
        })).toBe(100)
    })
    it("check attrs", async () => {
        await indexAction(databaseName, storeName, "odd", (storeIndex) => {
            expect(storeIndex instanceof IDBIndex).toBe(true)
            expect(storeIndex.keyPath).toBe("odd")
            expect(storeIndex.name).toBe("odd")
            expect(storeIndex.objectStore instanceof IDBObjectStore).toBe(true)
            expect(storeIndex.unique).toBe(false)
        })
    })
    it("check odd count", async () => {
        expect(await indexAction(databaseName, storeName, "odd", (storeIndex) => {
            return storeIndex.count()
        })).toBe(50)
    })
    it("check odd get", async () => {
        const result = await indexAction<Store>(databaseName, storeName, "odd", (storeIndex) => {
            return storeIndex.get("odd")
        })
        expect(result.id).toBe(2)
        expect(result.value).toBe(2)
        expect(result.odd).toBe("odd")
        expect(result.re10).toBe(2)
    })
    it("check odd getAll", async () => {
        const result = await indexAction<Store[]>(databaseName, storeName, "odd", (storeIndex) => {
            return storeIndex.getAll("odd")
        })
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(50)
        for (let i = 0; i < 50; i++) {
            const item = result[i]
            const re10 = (i % 5 + 1) * 2
            const value = Math.floor(i / 5) * 10 + re10
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        }
    })
    it("check odd getAllKeys", async () => {
        const result = await indexAction<number[]>(databaseName, storeName, "odd", (storeIndex) => {
            return storeIndex.getAllKeys("odd")
        })
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(50)
        for (let i = 1; i <= 50; i++) {
            const item = result[i - 1]
            const value = i * 2
            expect(item).toBe(value)
        }
    })
    it("check odd getKey", async () => {
        expect(await indexAction<Store>(databaseName, storeName, "odd", (storeIndex) => {
            return storeIndex.getKey("odd")
        })).toBe(2)
    })
    it("check re10 count", async () => {
        expect(await indexAction(databaseName, storeName, "re10", (storeIndex) => {
            return storeIndex.count()
        })).toBe(100)
    })
    it("check re10 get", async () => {
        for (let i = 1; i <= 10; i++) {
            const item = await indexAction<Store>(databaseName, storeName, "re10", (storeIndex) => {
                return storeIndex.get(i === 10 ? 0 : i)
            })
            expect(item.id).toBe(i)
            expect(item.value).toBe(i)
            expect(item.odd).toBe(i % 2 === 0 ? "odd" : undefined)
            expect(item.re10).toBe(i === 10 ? 0 : i)
        }
        expect(await indexAction(databaseName, storeName, "re10", (storeIndex) => {
            return storeIndex.get(10)
        })).toBe(undefined)
    })
    it("check re10 getAll", async () => {
        for (let i = 1; i <= 10; i++) {
            const re10 = i === 10 ? 0 : i
            const result = await indexAction<Store[]>(databaseName, storeName, "re10", (storeIndex) => {
                return storeIndex.getAll(i === 10 ? 0 : i)
            })
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBe(10)
            for (let j = 0; j < result.length; j++) {
                const item = result[j]
                const value = (j) * 10 + i
                const odd = i % 2 === 0 ? "odd" : undefined
                expect(item.id).toBe(value)
                expect(item.value).toBe(value)
                expect(item.odd).toBe(odd)
                expect(item.re10).toBe(re10)
            }
        }
    })
    it("check re10 getAllKeys", async () => {
        for (let i = 1; i <= 10; i++) {
            const result = await indexAction<number[]>(databaseName, storeName, "re10", (storeIndex) => {
                return storeIndex.getAllKeys(i === 10 ? 0 : i)
            })
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBe(10)
            for (let j = 0; j < result.length; j++) {
                const item = result[j]
                const value = (j) * 10 + i
                expect(item).toBe(value)
            }
        }
    })
    it("check re10 getKey", async () => {
        for (let i = 1; i <= 10; i++) {
            const result = await indexAction<number>(databaseName, storeName, "re10", (storeIndex) => {
                return storeIndex.getKey(i === 10 ? 0 : i)
            })
            expect(result).toBe(i)
        }
    })
    it("delete databse", async () => {
        await deleteDatabase(databaseName)
        expect(await getVersion(databaseName)).toBe(0)
    })
})