import "fake-indexeddb/auto"
import { IDBTransaction } from "fake-indexeddb"
import { storeAction } from "../store"
import { upgradeDatabase } from "../upgrade"
import { getVersion } from "./base"

const databaseName = "local-indexed"
const autoStoreName = "test-auto-store"
const storeName = "test-store"
const last = 100

type AutoStore = { id?: number, value: number, odd: boolean, re10: number }
type Store = Required<AutoStore>

describe("object store action", () => {
    it("create database and store", async () => {
        await upgradeDatabase(databaseName, 1, (database) => {
            [autoStoreName, storeName].forEach(store => {
                const autoIncrement = store === autoStoreName
                const objectStore = database.createObjectStore(store, { keyPath: "id", autoIncrement })
                objectStore.createIndex("odd", "odd", { unique: false })
                objectStore.createIndex("re10", "re10", { unique: false })
                for (let i = 1; i <= last; i++) {
                    const value = { value: i, odd: i % 2 === 0, re10: i % 10 }
                    if (!autoIncrement) Object.assign(value, { id: i })
                    objectStore.add(value)
                }
            })
        })
        expect(await getVersion(databaseName)).toBe(1)
    })
    it("check attrs", async () => {
        expect(await storeAction(databaseName, autoStoreName, "readonly", (objectStore) => {
            expect(objectStore.autoIncrement).toBe(true)
            expect(objectStore.keyPath).toBe("id")
            expect(objectStore.name).toBe(autoStoreName)
            expect([...objectStore.indexNames]).toEqual(["odd", "re10"])
            expect(objectStore.transaction instanceof IDBTransaction).toBe(true)
            expect(objectStore.transaction.mode).toBe("readonly")
            expect(objectStore.transaction.objectStoreNames).toEqual([autoStoreName])
            return objectStore.count()
        })).toBe(last)
        expect(await storeAction(databaseName, storeName, "readonly", (objectStore) => {
            expect(objectStore.autoIncrement).toBe(false)
            expect(objectStore.keyPath).toBe("id")
            expect(objectStore.name).toBe(storeName)
            expect([...objectStore.indexNames]).toEqual(["odd", "re10"])
            expect(objectStore.transaction instanceof IDBTransaction).toBe(true)
            expect(objectStore.transaction.mode).toBe("readonly")
            expect(objectStore.transaction.objectStoreNames).toEqual([storeName])
            return objectStore.count()
        })).toBe(last)
    })
    it("check count", async () => {
        const count = (objectStore: IDBObjectStore) => objectStore.count()
        expect(await storeAction(databaseName, autoStoreName, "readonly", count)).toBe(last)
        expect(await storeAction(databaseName, storeName, "readonly", count)).toBe(last)
    })
    it("check getAll", async () => {
        const getAll = (objectStore: IDBObjectStore) => objectStore.getAll()
        const autoStore = await storeAction<AutoStore[]>(databaseName, autoStoreName, "readonly", getAll)
        const store = await storeAction<Store[]>(databaseName, storeName, "readonly", getAll)
        expect(autoStore.length).toBe(last)
        expect(store.length).toBe(last)
        for (let i = 0; i < last; i++) {
            const value = i + 1
            expect(autoStore[i].id).toBe(value)
            expect(autoStore[i].odd).toBe(value % 2 === 0)
            expect(autoStore[i].re10).toBe(value % 10)
            expect(store[i].id).toBe(value)
            expect(store[i].odd).toBe(value % 2 === 0)
            expect(store[i].re10).toBe(value % 10)
        }
    })
    it("check get", async () => {
        for (let i = 1; i <= last; i++) {
            const autoItem = await storeAction<AutoStore>(databaseName, autoStoreName, "readonly", (objectStore) => {
                return objectStore.get(i)
            })
            expect(autoItem.id).toBe(i)
            expect(autoItem.odd).toBe(i % 2 === 0)
            expect(autoItem.re10).toBe(i % 10)
            const item = await storeAction<Store>(databaseName, storeName, "readonly", (objectStore) => {
                return objectStore.get(i)
            })
            expect(item.id).toBe(i)
            expect(item.odd).toBe(i % 2 === 0)
            expect(item.re10).toBe(i % 10)
        }
        const getItem = (objectStore: IDBObjectStore) => objectStore.get(last + 1)
        expect(await storeAction(databaseName, autoStoreName, "readonly", getItem)).toBe(undefined)
        expect(await storeAction(databaseName, storeName, "readonly", getItem)).toBe(undefined)
    })
    it("check getKey", async () => {
        for (let i = 1; i <= last; i++) {
            expect(await storeAction(databaseName, autoStoreName, "readonly", (objectStore) => {
                return objectStore.getKey(i)
            })).toBe(i)
            expect(await storeAction(databaseName, storeName, "readonly", (objectStore) => {
                return objectStore.getKey(i)
            })).toBe(i)
        }
        expect(await storeAction(databaseName, autoStoreName, "readonly", (objectStore) => {
            return objectStore.getKey(IDBKeyRange.bound(1, 100))
        })).toBe(1)
        expect(await storeAction(databaseName, storeName, "readonly", (objectStore) => {
            return objectStore.getKey(IDBKeyRange.bound(1, 100))
        })).toBe(1)
    })
    it("check getAllKeys", async () => {
        const autoStoreKeys = await storeAction<number[]>(databaseName, autoStoreName, "readonly", (objectStore) => {
            return objectStore.getAllKeys(IDBKeyRange.bound(1, 100))
        })
        expect(Array.isArray(autoStoreKeys)).toBe(true)
        expect(autoStoreKeys.length).toBe(last)
        autoStoreKeys.forEach((i, index) => {
            expect(i === index + 1).toBe(true)
        })
        const notAutoStoreKeys = await storeAction<number[]>(databaseName, autoStoreName, "readonly", (objectStore) => {
            return objectStore.getAllKeys(IDBKeyRange.bound(101, 200))
        })
        expect(Array.isArray(notAutoStoreKeys)).toBe(true)
        expect(notAutoStoreKeys.length).toBe(0)

        const storeKeys = await storeAction<number[]>(databaseName, storeName, "readonly", (objectStore) => {
            return objectStore.getAllKeys(IDBKeyRange.bound(1, 100))
        })
        expect(Array.isArray(storeKeys)).toBe(true)
        expect(storeKeys.length).toBe(last)
        storeKeys.forEach((i, index) => {
            expect(i === index + 1).toBe(true)
        })
        const notStoreKeys = await storeAction<number[]>(databaseName, storeName, "readonly", (objectStore) => {
            return objectStore.getAllKeys(IDBKeyRange.bound(101, 200))
        })
        expect(Array.isArray(notStoreKeys)).toBe(true)
        expect(notStoreKeys.length).toBe(0)
    })
})