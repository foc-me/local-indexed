import "fake-indexeddb/auto"
import { getDatabases, deleteDatabase } from "../indexed"
import { getDatabase } from "../database"
import { upgradeAction } from "../upgrade"
import { transactionAction } from "../transaction"
import { cursorAction } from "../cursor"
import { requestAction } from "../request"

type Store = { id: number, value: number, odd?: "odd", re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("check cursor", () => {
    it("check upgrade", async () => {
        await upgradeAction(databaseName, 1, (event) => {
            const { transaction } = event
            const objectStore = transaction.db.createObjectStore(storeName, {
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

        const databases = await getDatabases()
        expect(databases.length).toBe(1)
        expect(databases[0].name).toBe(databaseName)
        expect(databases[0].version).toBe(1)

        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readonly")
        const result = await transactionAction<Store[]>(transaction, () => {
            const objectStore = transaction.objectStore(storeName)
            return objectStore.getAll()
        })
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(100)
        for (let i = 0; i < result.length; i++) {
            const item = result[i]
            const value = i + 1
            const t = i % 10 + 1
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(i % 2 === 0 ? undefined : "odd")
            expect(item.re10).toBe(t === 10 ? 0 : t)
        }
    })
    it("check cursor", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readonly")
        const result = await transactionAction<Store[]>(transaction, async () => {
            const objectStore = transaction.objectStore(storeName)
            const request = objectStore.openCursor()
            const result: Store[] = []
            await cursorAction(request, (cursor) => {
                const value = cursor.value as Store
                if (value.odd === "odd") result.push(value)
                cursor.continue()
            })
            return { result }
        })
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(50)
        for (let i = 0; i < result.length; i++) {
            const item = result[i]
            const value = (i + 1) * 2
            const t = (i % 5 + 1) * 2
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(t === 10 ? 0 : t)
        }
    })
    it("check cursor stop", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readonly")
        const result = await transactionAction<Store[]>(transaction, async () => {
            const objectStore = transaction.objectStore(storeName)
            const request = objectStore.openCursor()
            const result: Store[] = []
            await cursorAction(request, (cursor) => {
                const value = cursor.value as Store
                if (value.odd === "odd") result.push(value)
                if (value.id < 51) cursor.continue()
                else return true
            })
            return { result }
        })
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(25)
        for (let i = 0; i < result.length; i++) {
            const item = result[i]
            const value = (i + 1) * 2
            const t = (i % 5 + 1) * 2
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(t === 10 ? 0 : t)
        }
    })
    it("check cursor update", async () => {
        const database = await getDatabase(databaseName)
        const writeTrans = database.transaction(storeName, "readwrite")
        const ids = await transactionAction<number[]>(writeTrans, async () => {
            const objectStore = writeTrans.objectStore(storeName)
            const request = objectStore.openCursor()
            const result: number[] = []
            await cursorAction(request, async (cursor) => {
                const value = cursor.value as Store
                const nextValue = value.value * 10
                const id = await requestAction<number>(() => {
                    const odd = nextValue % 2 === 0 ? { odd: "odd" } : {}
                    return cursor.update(Object.assign({
                        id: value.id,
                        value: nextValue,
                        re10: nextValue % 10
                    }, odd))
                })
                result.push(id)
                cursor.continue()
            })
            return { result }
        }, { autoClose: false })
        expect(Array.isArray(ids)).toBe(true)
        expect(ids.length).toBe(100)
        for (let i = 0; i < ids.length; i++) {
            expect(ids[i]).toBe(i + 1)
        }

        const readTrans = database.transaction(storeName, "readonly")
        const result = await transactionAction<Store[]>(readTrans, () => {
            const objectStore = readTrans.objectStore(storeName)
            return objectStore.getAll()
        })
        expect(result.length).toBe(100)
        for (let i = 0; i < result.length; i++) {
            const item = result[i]
            expect(item.id).toBe(i + 1)
            expect(item.value).toBe((i + 1) * 10)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(0)
        }
    })
    it("check cursor delete", async () => {
        const database = await getDatabase(databaseName)
        const writeTrans = database.transaction(storeName, "readwrite")
        const ids = await transactionAction<number[]>(writeTrans, async () => {
            const objectStore = writeTrans.objectStore(storeName)
            const request = objectStore.openCursor()
            const result: number[] = []
            await cursorAction(request, (cursor) => {
                const value = cursor.value as Store
                if ([1, 2, 3, 4, 5].includes(value.id % 10)) {
                    cursor.delete()
                    result.push(value.id)
                }
                cursor.continue()
            })
            return { result }
        }, { autoClose: false })
        expect(Array.isArray(ids)).toBe(true)
        expect(ids.length).toBe(50)
        for (let i = 0; i < ids.length; i++) {
            expect(ids[i]).toBe(Math.floor(i / 5) * 10 + i % 5 + 1)
        }

        const readTrans = database.transaction(storeName, "readonly")
        const result = await transactionAction<Store[]>(readTrans, () => {
            const objectStore = readTrans.objectStore(storeName)
            return objectStore.getAll()
        })
        expect(result.length).toBe(50)
        for (let i = 0; i < result.length; i++) {
            const item = result[i]
            const id = Math.floor(i / 5) * 10 + i % 5 + 6
            expect(item.id).toBe(id)
            expect(item.value).toBe(id * 10)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(0)
        }
    })
    it("check delete database", async () => {
        await deleteDatabase(databaseName)
        expect((await getDatabases()).length).toBe(0)
    })
})