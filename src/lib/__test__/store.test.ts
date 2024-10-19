import "fake-indexeddb/auto"
import { IDBTransaction } from "fake-indexeddb"
import { deleteDatabase, getDatabases } from "../indexed"
import { storeAction } from "../store"
import { upgradeDatabase } from "../upgrade"
import { getVersion } from "../database"

const databaseName = "local-indexed"
const autoStoreName = "test-auto-store"
const storeName = "test-store"
const last = 100

type AutoStore = { id?:number, value: number, odd: boolean, re10: number }
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
    it("check get all", async () => {
        const getAll = (objectStore: IDBObjectStore) => objectStore.getAll()
        const autoStore = await storeAction<AutoStore[]>(databaseName, autoStoreName, "readonly", getAll)
        const store = await storeAction<Store[]>(databaseName, storeName, "readonly", getAll)
        expect(autoStore.length).toBe(last)
        expect(store.length).toBe(last)
    })
})