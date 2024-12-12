import "fake-indexeddb/auto"
import { getDatabases, deleteDatabase } from "../../lib/indexed"
import { upgradeAction } from "../../lib/upgrade"
import { getDatabase } from "../../lib/database"
import { transactionAction } from "../../lib/transaction"

type Store = {
    id: number
    number: number
    string: string
    boolean: boolean
    object: object
    undefined: undefined
    null: null
    array: any[]
    reg: RegExp
    arrayBuffer: ArrayBuffer
    error: Error
    file: File
    blob: Blob
    map: Map<string, any>
    set: Set<any>
    date: Date
}

const databaseName = "local-indexed"
const storeName = "test-store"

describe("check upgrade", () => {
    it("check empty indexed", async () => {
        expect((await getDatabases()).length).toBe(0)
    })
    it("check create database", async () => {
        await upgradeAction(databaseName, 1, (event) => {
            const { transaction } = event
            const { db } = transaction
            db.createObjectStore(storeName, {
                keyPath: "id",
                autoIncrement: true
            })
            expect(db.objectStoreNames.length).toBe(1)
        })
    })
    it("check insert value", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readwrite")
        expect(await transactionAction(transaction, () => {
            const objectStore = transaction.objectStore(storeName)
            return objectStore.add(["dddddddddd"])
        })).toBe(1)
    })
    it("check first", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readwrite")
        const store = await transactionAction<{ id: number, "0": string }>(transaction, () => {
            const objectStore = transaction.objectStore(storeName)
            return objectStore.get(1)
        })
        expect(store.id).toBe(1)
        expect(store["0"]).toBe("dddddddddd")
    })
    it("check insert store", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readwrite")
        expect(await transactionAction(transaction, async () => {
            const objectStore = transaction.objectStore(storeName)
            const fileBlob = new Blob(["<div>hello world</div>"], { type: "text/html" })
            return objectStore.add({
                number: 111,
                string: "target is string",
                boolean: true,
                object: { target: "target is string" },
                undefined: undefined,
                null: null,
                array: [1, 1, 2, 3, 3, 4, 5, 5, 6],
                reg: /^<.+>$/,
                arrayBuffer: await fileBlob.arrayBuffer(),
                error: new Error("target is string"),
                file: new File([fileBlob], "testfile.html", { type: fileBlob.type }),
                blob: fileBlob,
                map: new Map([["target", "target is string"]]),
                set: new Set([1, 1, 2, 3, 3, 4, 5, 5, 6]),
                date: new Date("2024/10/01 12:00:00:000")
            })
        })).toBe(2)
    })
    it("check last", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readwrite")
        const store = await transactionAction<Store>(transaction, () => {
            const objectStore = transaction.objectStore(storeName)
            return objectStore.get(2)
        })
        expect(store.id).toBe(2)
        expect(store.number).toBe(111)
        expect(store.string).toBe("target is string")
        expect(store.boolean).toBe(true)
        expect(store.object).toEqual({ target: "target is string" })
        expect(store.undefined).toBe(undefined)
        expect(store.null).toBe(null)
        expect(Array.isArray(store.array)).toBe(true)
        expect(store.array).toEqual([1, 1, 2, 3, 3, 4, 5, 5, 6])
        expect(store.reg instanceof RegExp).toBe(true)
        expect(store.reg.toString()).toBe("/^<.+>$/")
        expect(store.arrayBuffer instanceof ArrayBuffer).toBe(true)
        expect(store.arrayBuffer.byteLength).toBe(22)
        expect(store.error.message).toBe("target is string")
        expect(store.file instanceof File).toBe(true)
        expect(store.file.name).toBe("testfile.html")
        expect(store.file.size).toBe(22)
        expect(store.file.type).toBe("text/html")
        expect(store.blob instanceof Blob).toBe(true)
        expect(await store.blob.text()).toBe("<div>hello world</div>")
        expect(store.blob.type).toBe("text/html")
        expect(store.blob.size).toBe(22)
        expect(store.map.size).toBe(1)
        expect(store.map.get("target")).toBe("target is string")
        expect(store.set.size).toBe(6)
        const sets = await new Promise(resolve => {
            const values = store.set.values()
            let next = values.next()
            const result: number[] = []
            while (!next.done) {
                result.push(next.value)
                next = values.next()
            }
            resolve(result)
        })
        expect(sets).toEqual([1, 2, 3, 4, 5, 6])
        expect(store.date instanceof Date).toBe(true)
        expect(store.date.getTime()).toBe(1727755200000)
    })
    it("check delete database", async () => {
        await deleteDatabase(databaseName)
        expect((await getDatabases()).length).toBe(0)
    })
})