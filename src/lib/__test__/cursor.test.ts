import "fake-indexeddb/auto"
import { getDatabases, deleteDatabase } from "../indexed"
import { getDatabase } from "../database"
import { upgradeAction } from "../upgrade"
import { transactionAction } from "../transaction"
import { cursorAction } from "../cursor"

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
    })
    it("check datas", async () => {
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
            const cursor = objectStore.openCursor()
            const result = await cursorAction<Store>(cursor, (current) => {
                return current.odd === "odd"
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
            const cursor = objectStore.openCursor()
            const result = await cursorAction<Store>(cursor, (current, stop) => {
                if (current.id === 51) stop()
                return current.odd === "odd"
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
    it("check delete database", async () => {
        await deleteDatabase(databaseName)
        expect((await getDatabases()).length).toBe(0)
    })
})