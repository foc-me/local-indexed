import "fake-indexeddb/auto"
import { countStore, getStoreItem } from "./base"
import { getVersion } from "../database"
import { upgradeDatabase } from "../upgrade"

const databaseName = "local-indexed"
const storeName = "test-store"
const store: IDBObjectStoreParameters = {
    keyPath: "id",
    autoIncrement: true
}
const last = 100

type Value = { id?: number, value: number, odd: boolean, re10: number }
function createValues() {
    const values: Array<Value> = []
    for (let i = 0; i < last; i++) {
        values.push({ value: i, odd: i % 2 === 0, re10: i % 10 })
    }
    return values
}
const defaultValues = createValues()

type UpgradeValue = { value: number, odd: boolean, re3: number }

describe("upgrade database store", () => {
    it("create database", async () => {
        await upgradeDatabase(databaseName, 1, (database) => {
            const objectStore = database.createObjectStore(storeName, store)
            objectStore.createIndex("re10", "re10", { unique: false })
            defaultValues.forEach(value => { objectStore.add(value) })
        })
        expect(await getVersion(databaseName)).toBe(1)
    })
    it("count store values", async () => {
        expect(await countStore(databaseName, storeName)).toBe(last)
        expect(await getStoreItem(databaseName, storeName, 0)).toBe(undefined)
        for (let i = 1; i <= last; i++) {
            const current = i - 1
            const item = await getStoreItem<Value>(databaseName, storeName, i)
            if (!item) throw new Error("item should not be undefined")
            expect(item.id).toBe(i)
            expect(item.value).toBe(current)
            expect(item.odd).toBe(current % 2 === 0)
            expect(item.re10).toBe(current % 10)
        }
        expect(await getStoreItem(databaseName, storeName, last + 1)).toBe(undefined)
    })
    // it("upgrade database", async () => {
    //     await upgradeDatabase(databaseName, 2, (database) => {
    //         database.createObjectStore(storeName, store)
    //     })
    // })
})