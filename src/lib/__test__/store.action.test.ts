import "fake-indexeddb/auto"
import { storeAction } from "../store"
import { upgradeDatabase } from "../upgrade"
import { deleteDatabase } from "../indexed"
import { getVersion } from "./base"

type Store = { id: number, value: number, odd: boolean, re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"
const count = (objectStore: IDBObjectStore) => objectStore.count()
const clear = (objectStore: IDBObjectStore) => objectStore.clear()

describe("object store action", () => {
    it("create database", async () => {
        expect(await getVersion(databaseName)).toBe(0)
        await upgradeDatabase(databaseName, 1, (database) => {
            database.createObjectStore(storeName, {
                keyPath: "id",
                autoIncrement: true
            })
        })
        expect(await getVersion(databaseName)).toBe(1)
    })
    it("check add", async () => {
        for (let i = 1; i <= 100; i++) {
            const id = await storeAction(databaseName, storeName, (objectStore) => {
                const odd = i % 2 === 0 ? { odd: "odd"} : {}
                return objectStore.add(Object.assign({ value: i, re10: i % 10 }, odd))
            }, "readwrite")
            expect(id).toBe(i)
        }
        expect(await storeAction(databaseName, storeName, count)).toBe(100)
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
    it("check put", async () => {
        for (let i = 1; i <= 50; i++) {
            const next = i * 10
            const id = await storeAction(databaseName, storeName, (objectStore) => {
                const odd = next % 2 === 0 ? { odd: "odd"} : {}
                return objectStore.put(Object.assign({ id: i, value: next, re10: next % 10 }, odd))
            }, "readwrite")
            expect(id).toBe(i)
        }
        expect(await storeAction(databaseName, storeName, count)).toBe(100)
        for (let i = 1; i <= 100; i++) {
            const item = await storeAction<Store>(databaseName, storeName, (objectStore) => {
                return objectStore.get(i)
            })
            const value = i <= 50 ? i * 10 : i
            const odd = value % 2 === 0 ? "odd" : undefined
            expect(item.id).toBe(i)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(odd)
            expect(item.re10).toBe(value % 10)
        }
    })
    it("check delete", async () => {
        for (let i = 1; i <= 10; i++) {
            await storeAction(databaseName, storeName, (objectStore) => {
                return objectStore.delete(i)
            }, "readwrite")
        }
        expect(await storeAction(databaseName, storeName, count)).toBe(90)
        for (let i = 1; i <= 100; i++) {
            const item = await storeAction<Store>(databaseName, storeName, (objectStore) => {
                return objectStore.get(i)
            })
            if (i <= 10) expect(item).toBe(undefined)
            else {
                const value = i <= 50 ? i * 10 : i
                const odd = value % 2 === 0 ? "odd" : undefined
                expect(item.id).toBe(i)
                expect(item.value).toBe(value)
                expect(item.odd).toBe(odd)
                expect(item.re10).toBe(value % 10)
            }
        }

        await storeAction(databaseName, storeName, (objectStore) => {
            return objectStore.delete(IDBKeyRange.bound(11, 20))
        }, "readwrite")
        expect(await storeAction(databaseName, storeName, count)).toBe(80)
        for (let i = 1; i <= 100; i++) {
            const item = await storeAction<Store>(databaseName, storeName, (objectStore) => {
                return objectStore.get(i)
            })
            if (i <= 20) expect(item).toBe(undefined)
            else {
                const value = i <= 50 ? i * 10 : i
                const odd = value % 2 === 0 ? "odd" : undefined
                expect(item.id).toBe(i)
                expect(item.value).toBe(value)
                expect(item.odd).toBe(odd)
                expect(item.re10).toBe(value % 10)
            }
        }
    })
    it("check clear", async () => {
        await storeAction(databaseName, storeName, clear, "readwrite")
        expect(await storeAction(databaseName, storeName, count)).toBe(0)
    })
    it("delete databse", async () => {
        await deleteDatabase(databaseName)
        expect(await getVersion(databaseName)).toBe(0)
    })
})