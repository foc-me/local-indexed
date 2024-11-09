import "fake-indexeddb/auto"
import { getDatabases, deleteDatabase } from "../indexed"
import { upgradeDatabase } from "../upgrade"
import { storeCursorAction } from "../cursor"
import { requestAction } from "../transaction"
import { getStoreIndexNames } from "../storeIndex"
import { existsDatabase } from "./base"

type Store = { id: number, value: number, odd?: string, re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("upgrade event", () => {
    it("create database", async () => {
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
        expect((await getDatabases()).length).toBe(1)
        expect(await existsDatabase(databaseName)).toBe(true)
    })
    it("check data", async () => {
        const result = await storeCursorAction<Store>(databaseName, storeName, () => true)
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(100)
    })
    it("upgrade with event", async () => {
        await upgradeDatabase(databaseName, 2, async (database, event) => {
            const { transaction } = event.target as IDBOpenDBRequest
            if (transaction) {
                const objectStore = transaction.objectStore(storeName)
                const result = await requestAction<Store[]>(() => {
                    return objectStore.getAll()
                })
                transaction.db.deleteObjectStore(storeName)
                const upgradeStore = transaction.db.createObjectStore(storeName, {
                    keyPath: "id",
                    autoIncrement: true
                })
                result.forEach(item => {
                    const request = upgradeStore.add(item)
                    request.addEventListener("success", () => {
                        expect(request.result).toBe(item.id)
                    })
                })
            }
        })
        expect(await getStoreIndexNames(databaseName, storeName)).toEqual([])
    })
    it("check data", async () => {
        const result = await storeCursorAction<Store>(databaseName, storeName, () => true)
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(100)
    })
    it("check createIndex", async () => {
        await upgradeDatabase(databaseName, 3, async (database, event) => {
            const { transaction } = event.target as IDBOpenDBRequest
            if (transaction) {
                const objectStore = transaction.objectStore(storeName)
                objectStore.createIndex("odd", "odd", { unique: false })
                objectStore.createIndex("re10", "re10", { unique: false })
            }
        })
        expect(await getStoreIndexNames(databaseName, storeName)).toEqual(["odd", "re10"])
    })
    it("check data", async () => {
        const result = await storeCursorAction<Store>(databaseName, storeName, () => true)
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(100)
    })
    it("delete test database", async () => {
        await deleteDatabase(databaseName)
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase(databaseName)).toBe(false)
    })
})