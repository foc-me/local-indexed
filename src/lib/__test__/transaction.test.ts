import "fake-indexeddb/auto"
import { getDatabases, deleteDatabase } from "../indexed"
import { getDatabase } from "../database"
import { upgradeAction } from "../upgrade"
import { transactionAction } from "../transaction"
import { requestAction } from "../request"

const databaseName = "local-indexed"

describe("check transaction action", () => {
    it("check create", async () => {
        await upgradeAction(databaseName, 1, async (event) => {
            const { transaction } = event
            transaction.db.createObjectStore("values", {
                keyPath: "id",
                autoIncrement: true
            })
            transaction.db.createObjectStore("odds", {
                keyPath: "id",
                autoIncrement: false
            })
            transaction.db.createObjectStore("re10s", {
                keyPath: "id",
                autoIncrement: false
            })
            expect(transaction.db.objectStoreNames.length).toBe(3)
            // try abort upgrade
            // throw new Error("error")
        })
        expect((await getDatabases()).length).toBe(1)
    })
    it("check add", async () => {
        const database = await getDatabase(databaseName)
        const stores = [...database.objectStoreNames]
        const transaction = database.transaction(stores, "readwrite")
        await transactionAction(transaction, async () => {
            for (let i = 1; i <= 100; i++) {
                const id = await requestAction(() => {
                    return transaction.objectStore("values").add({ value: i })
                })
                expect(id).toBe(i)
                expect(await requestAction(() => {
                    return transaction.objectStore("odds").add({ id, odd: i % 2 === 0 })
                })).toBe(i)
                // try abort transaction
                // if (i === 77) throw new Error("77")
                expect(await requestAction(() => {
                    return transaction.objectStore("re10s").add({ id, re10: i % 10 })
                })).toBe(i)
            }
        })
    })
    it("check count", async () => {
        const database = await getDatabase(databaseName)
        const stores = [...database.objectStoreNames]
        expect(stores.length).toBe(3)
        const transaction = database.transaction(stores, "readonly")
        await transactionAction(transaction, async () => {
            expect(await requestAction(() => {
                return transaction.objectStore("values").count()
            })).toBe(100)
            expect(await requestAction(() => {
                return transaction.objectStore("odds").count()
            })).toBe(100)
            expect(await requestAction(() => {
                return transaction.objectStore("re10s").count()
            })).toBe(100)
        })
    })
    it("check datas", async () => {
        const database = await getDatabase(databaseName)
        const stores = [...database.objectStoreNames]
        const transaction = database.transaction(stores, "readonly")
        await transactionAction(transaction, async () => {
            for (let i = 0; i < 100; i++) {
                const id = i + 1
                const item = await requestAction<{ id: number, value: number }>(() => {
                    return transaction.objectStore("values").get(id)
                })
                const odd = await requestAction<{ id: number, odd: boolean }>(() => {
                    return transaction.objectStore("odds").get(id)
                })
                const re10 = await requestAction<{ id: number, re10: number }>(() => {
                    return transaction.objectStore("re10s").get(id)
                })
                expect(item.id).toBe(i + 1)
                expect(item.value).toBe(i + 1)
                expect(odd.id).toBe(i + 1)
                expect(odd.odd).toBe((i + 1) % 2 === 0)
                expect(re10.id).toBe(i + 1)
                expect(re10.re10).toBe((i + 1) % 10)
            }
        })
    })
    it("check delete database", async () => {
        await deleteDatabase(databaseName)
        expect((await getDatabases()).length).toBe(0)
    })
})