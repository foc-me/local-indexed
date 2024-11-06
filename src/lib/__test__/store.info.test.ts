import "fake-indexeddb/auto"
import { IDBTransaction } from "fake-indexeddb"
import { storeAction } from "../store"
import { upgradeDatabase } from "../upgrade"
import { deleteDatabase } from "../indexed"
import { getVersion } from "./base"

type Store = { id: number, value: number, odd: boolean, re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"
const count = (objectStore: IDBObjectStore) => objectStore.count()
const getAll = (objectStore: IDBObjectStore) => objectStore.getAll()

describe("object store info", () => {
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
    })
    it("check attrs", async () => {
        expect(await storeAction(databaseName, storeName, (objectStore) => {
            expect(objectStore instanceof IDBObjectStore).toBe(true)
            expect(objectStore.autoIncrement).toBe(true)
            expect(objectStore.keyPath).toBe("id")
            expect(objectStore.name).toBe(storeName)
            expect(objectStore.indexNames).toEqual(["odd", "re10"])
            expect(objectStore.transaction instanceof IDBTransaction).toBe(true)
            expect(objectStore.transaction.mode).toBe("readonly")
            expect(objectStore.transaction.objectStoreNames).toEqual([storeName])
            return objectStore.count()
        })).toBe(100)
    })
    it("check count", async () => {
        expect(await storeAction(databaseName, storeName, count)).toBe(100)
    })
    it("check getAll", async () => {
        const store = await storeAction<Store[]>(databaseName, storeName, getAll)
        expect(store.length).toBe(100)
        for (let i = 0; i < 100; i++) {
            const value = i + 1
            const odd = value % 2 === 0 ? "odd" : undefined
            expect(store[i].id).toBe(value)
            expect(store[i].value).toBe(value)
            expect(store[i].odd).toBe(odd)
            expect(store[i].re10).toBe(value % 10)
        }
    })
    it("check get", async () => {
        for (let i = 1; i <= 100; i++) {
            const item = await storeAction<Store>(databaseName, storeName, (objectStore) => {
                return objectStore.get(i)
            })
            const odd = i % 2 === 0 ? "odd" : undefined
            expect(item.id).toBe(i)
            expect(item.value).toBe(i)
            expect(item.odd).toBe(odd)
            expect(item.re10).toBe(i % 10)
        }
        expect(await storeAction(databaseName, storeName, (objectStore: IDBObjectStore) => {
            return objectStore.get(101)
        })).toBe(undefined)
    })
    it("check getKey", async () => {
        for (let i = 1; i <= 100; i++) {
            expect(await storeAction(databaseName, storeName, (objectStore) => {
                return objectStore.getKey(i)
            })).toBe(i)
        }
        expect(await storeAction(databaseName, storeName, (objectStore) => {
            return objectStore.getKey(IDBKeyRange.bound(1, 100))
        })).toBe(1)
    })
    it("check getAllKeys", async () => {
        const storeKeys = await storeAction<number[]>(databaseName, storeName, (objectStore) => {
            return objectStore.getAllKeys(IDBKeyRange.bound(1, 100))
        })
        expect(Array.isArray(storeKeys)).toBe(true)
        expect(storeKeys.length).toBe(100)
        storeKeys.forEach((i, index) => {
            expect(i === index + 1).toBe(true)
        })
        const notStoreKeys = await storeAction<number[]>(databaseName, storeName, (objectStore) => {
            return objectStore.getAllKeys(IDBKeyRange.bound(101, 200))
        })
        expect(Array.isArray(notStoreKeys)).toBe(true)
        expect(notStoreKeys.length).toBe(0)
    })
    it("delete databse", async () => {
        await deleteDatabase(databaseName)
        expect(await getVersion(databaseName)).toBe(0)
    })
})