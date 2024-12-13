import "fake-indexeddb/auto"
import { getDatabases, deleteDatabase } from "../../src/lib/indexed"
import { getDatabase } from "../../src/lib/database"
import { upgradeAction } from "../../src/lib/upgrade"
import { transactionAction } from "../../src/lib/transaction"
import { cursorAction } from "../../src/lib/cursor"
import { requestAction } from "../../src/lib/request"

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
        const results = await transactionAction<Store[]>(transaction, () => {
            const objectStore = transaction.objectStore(storeName)
            return objectStore.getAll()
        })
        expect(Array.isArray(results)).toBe(true)
        expect(results.length).toBe(100)
        for (let i = 0; i < results.length; i++) {
            const item = results[i]
            const value = i + 1
            const re10 = i % 10 + 1
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(i % 2 === 0 ? undefined : "odd")
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        }
    })
    it("check odd cursor", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readonly")
        const results = await transactionAction<Store[]>(transaction, async () => {
            const objectStore = transaction.objectStore(storeName)
            const odd = objectStore.index("odd")
            const request = odd.openCursor()
            const result: Store[] = []
            await cursorAction(request, (cursor) => {
                result.push(cursor.value as Store)
                cursor.continue()
            })
            return { result }
        })

        expect(Array.isArray(results)).toBe(true)
        expect(results.length).toBe(50)
        for (let i = 0; i < results.length; i++) {
            const item = results[i]
            const value = (i + 1) * 2
            const re10 = (i % 5 + 1) * 2
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        }
    })
    it("check re10 cursor", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readonly")
        const results = await transactionAction<Store[]>(transaction, async () => {
            const objectStore = transaction.objectStore(storeName)
            const re = objectStore.index("re10")
            const request = re.openCursor()
            const result: Store[] = []
            await cursorAction(request, (cursor) => {
                const value = cursor.value as Store
                if (value.re10 > 4) result.push(value)
                cursor.continue()
            })
            return { result }
        })

        expect(results.length).toBe(50)
        for (let i = 0; i < results.length; i++) {
            const item = results[i]
            const re10 = Math.floor(i / 10) + 5
            const value = i % 10 * 10 + re10
            const odd = Math.floor(i / 10) % 2 === 0 ? undefined : "odd"
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(odd)
            expect(item.re10).toBe(re10)
        }
    })
    it("check odd cursor stop", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readonly")
        const results = await transactionAction<Store[]>(transaction, async () => {
            const objectStore = transaction.objectStore(storeName)
            const odd = objectStore.index("odd")
            const request = odd.openCursor()
            const result: Store[] = []
            await cursorAction(request, (cursor) => {
                const value = cursor.value as Store
                if (value.odd === "odd") result.push(value)
                if (value.id < 50) cursor.continue()
                else return true
            })
            return { result }
        })

        expect(Array.isArray(results)).toBe(true)
        expect(results.length).toBe(25)
        for (let i = 0; i < results.length; i++) {
            const item = results[i]
            const value = (i + 1) * 2
            const re10 = (i % 5 + 1) * 2
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(re10 === 10 ? 0 : re10)
        }
    })
    it("check re10 cursor stop", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readonly")
        const results = await transactionAction<Store[]>(transaction, async () => {
            const objectStore = transaction.objectStore(storeName)
            const re = objectStore.index("re10")
            const request = re.openCursor()
            const result: Store[] = []
            await cursorAction(request, (cursor) => {
                const value = cursor.value as Store
                if (value.re10 > 4) result.push(value)
                if (result.length < 25) cursor.continue()
                else return true
            })
            return { result }
        })

        expect(results.length).toBe(25)
        for (let i = 0; i < results.length; i++) {
            const item = results[i]
            const re10 = Math.floor(i / 10) + 5
            const value = i % 10 * 10 + re10
            const odd = Math.floor(i / 10) % 2 === 0 ? undefined : "odd"
            expect(item.id).toBe(value)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(odd)
            expect(item.re10).toBe(re10)
        }
    })
    it("check odd cursor update", async () => {
        const database = await getDatabase(databaseName)
        const writeTrans = database.transaction(storeName, "readwrite")
        const ids = await transactionAction<number[]>(writeTrans, async () => {
            const objectStore = writeTrans.objectStore(storeName)
            const odd = objectStore.index("odd")
            const request = odd.openCursor()
            const result: number[] = []
            await cursorAction(request, async (cursor) => {
                const value = cursor.value as Store
                const id = await requestAction<number>(() => {
                    return cursor.update({
                        id: value.id,
                        value: value.value * 10,
                        odd: "odd",
                        re10: 0
                    })
                })
                result.push(id)
                cursor.continue()
            })
            return { result }
        }, { autoClose: false })
        expect(Array.isArray(ids)).toBe(true)
        expect(ids.length).toBe(50)
        ids.forEach((id, index) => {
            expect(id).toBe((index + 1) * 2)
        })

        const readTrans = database.transaction(storeName, "readonly")
        const results = await transactionAction<Store[]>(readTrans, () => {
            const objectStore = readTrans.objectStore(storeName)
            return objectStore.getAll()
        })
        expect(results.length).toBe(100)
        for (let i = 0; i < results.length; i++) {
            const item = results[i]
            const value = i % 2 === 0 ? i + 1 : (i + 1) * 10
            const odd = i % 2 === 0 ? undefined : "odd"
            const re10 = i % 2 === 0 ? (i + 1) % 10 : 0
            expect(item.id).toBe(i + 1)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(odd)
            expect(item.re10).toBe(re10)
        }
    })
    it("check re10 cursor update", async () => {
        const database = await getDatabase(databaseName)
        const writeTrans = database.transaction(storeName, "readwrite")
        const ids = await transactionAction<number[]>(writeTrans, async () => {
            const objectStore = writeTrans.objectStore(storeName)
            const re = objectStore.index("re10")
            const request = re.openCursor()
            const result: number[] = []
            await cursorAction(request, async (cursor) => {
                const value = cursor.value as Store
                if (value.re10 !== 0) {
                    const id = await requestAction<number>(() => {
                        return cursor.update({
                            id: value.id,
                            value: value.value * 10,
                            odd: "odd",
                            re10: 0
                        })
                    })
                    result.push(id)
                }
                cursor.continue()
            })
            return { result }
        }, { autoClose: false })
        expect(Array.isArray(ids)).toBe(true)
        expect(ids.length).toBe(50)
        ids.forEach((id, index) => {
            expect(id).toBe(Math.floor(index / 10) * 2 + 1 + index % 10 * 10)
        })

        const readTrans = database.transaction(storeName, "readonly")
        const results = await transactionAction<Store[]>(readTrans, () => {
            const objectStore = readTrans.objectStore(storeName)
            return objectStore.getAll()
        })
        expect(results.length).toBe(100)
        for (let i = 0; i < results.length; i++) {
            const item = results[i]
            expect(item.id).toBe(i + 1)
            expect(item.value).toBe((i + 1) * 10)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(0)
        }
    })
    it("check odd cursor delete", async () => {
        const database = await getDatabase(databaseName)
        const writeTrans = database.transaction(storeName, "readwrite")
        const ids = await transactionAction<number[]>(writeTrans, async () => {
            const objectStore = writeTrans.objectStore(storeName)
            const odd = objectStore.index("odd")
            const request = odd.openCursor()
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
        ids.forEach((id, index) => {
            expect(id).toBe(Math.floor(index / 5) * 10 + index % 5 + 1)
        })

        const readTrans = database.transaction(storeName, "readonly")
        const results = await transactionAction<Store[]>(readTrans, () => {
            const objectStore = readTrans.objectStore(storeName)
            return objectStore.getAll()
        })
        expect(results.length).toBe(50)
        for (let i = 0; i < results.length; i++) {
            const item = results[i]
            const id = Math.floor(i / 5) * 10 + i % 5 + 6
            expect(item.id).toBe(id)
            expect(item.value).toBe(id * 10)
            expect(item.odd).toBe("odd")
            expect(item.re10).toBe(0)
        }
    })
    it("check re10 cursor delete", async () => {
        const database = await getDatabase(databaseName)
        const writeTrans = database.transaction(storeName, "readwrite")
        const ids = await transactionAction<number[]>(writeTrans, async () => {
            const objectStore = writeTrans.objectStore(storeName)
            const odd = objectStore.index("odd")
            const request = odd.openCursor()
            const result: number[] = []
            await cursorAction(request, (cursor) => {
                const value = cursor.value as Store
                cursor.delete()
                result.push(value.id)
                cursor.continue()
            })
            return { result }
        }, { autoClose: false })
        expect(Array.isArray(ids)).toBe(true)
        expect(ids.length).toBe(50)
        ids.forEach((id, index) => {
            expect(id).toBe(Math.floor(index / 5) * 10 + index % 5 + 6)
        })

        const readTrans = database.transaction(storeName, "readonly")
        const results = await transactionAction<Store[]>(readTrans, () => {
            const objectStore = readTrans.objectStore(storeName)
            return objectStore.getAll()
        })
        expect(results.length).toBe(0)
    })
    it("check delete database", async () => {
        await deleteDatabase(databaseName)
        expect((await getDatabases()).length).toBe(0)
    })
})