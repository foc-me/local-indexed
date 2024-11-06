import "fake-indexeddb/auto"
import { getDatabases, deleteDatabase } from "../indexed"
import { upgradeDatabase } from "../upgrade"
import { storeAction } from "../store"
import { getVersion, existsDatabase } from "./base"

type Store = { id: number, value: number, odd: boolean, re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("upgrade database store", () => {
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
        expect(await getVersion(databaseName)).toBe(1)
    })
    it("check data", async () => {
        expect(await storeAction(databaseName, storeName, (objectStore) => {
            return objectStore.count()
        })).toBe(100)
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
    })
    it("upgrade database", async () => {
        const items = await storeAction<Store[]>(databaseName, storeName, (objectStore) => {
            return objectStore.getAll()
        })
        expect(items.length).toBe(100)
        await upgradeDatabase(databaseName, 2, (database) => {
            database.deleteObjectStore(storeName)
            const objectStore = database.createObjectStore(storeName, {
                keyPath: "id",
                autoIncrement: true
            })
            for (let i = 0; i < items.length; i++) {
                const item = items[i]
                const next = item.value * 10
                const odd = next % 2 === 0 ? { odd: "odd" } : {}
                objectStore.add(Object.assign({ id: item.id, value: next, re10: next % 10 }, odd))
            }
        })
        expect(await getVersion(databaseName)).toBe(2)
    })
    it("check upgrade data", async () => {
        expect(await storeAction(databaseName, storeName, (objectStore) => {
            return objectStore.count()
        })).toBe(100)
        for (let i = 1; i <= 100; i++) {
            const item = await storeAction<Store>(databaseName, storeName, (objectStore) => {
                return objectStore.get(i)
            })
            const value = i * 10
            expect(item.id).toBe(i)
            expect(item.value).toBe(value)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(value % 10)
        }
    })
    it("delete test database", async () => {
        await deleteDatabase(databaseName)
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase(databaseName)).toBe(false)
    })
})