import "fake-indexeddb/auto"
import { getStoreIndexNames } from "../storeIndex"
import { upgradeDatabase } from "../upgrade"
import { getVersion } from "../database"

const databaseName = "local-indexed"
const autoStoreName = "test-auto-store"
const storeName = "test-store"
const last = 100

type AutoStore = { id?:number, value: number, odd: boolean, re10: number }
type Store = Required<AutoStore>

describe("object store apis", () => {
    it("create database and store", async () => {
        await upgradeDatabase(databaseName, 1, (database) => {
            [autoStoreName, storeName].forEach(store => {
                const autoIncrement = store === autoStoreName
                const objectStore = database.createObjectStore(store, { keyPath: "id", autoIncrement })
                objectStore.createIndex("odd", "odd", { unique: false })
                objectStore.createIndex("re10", "re10", { unique: false })
                for (let i = 1; i <= last; i++) {
                    const value = { value: i, odd: i % 2 === 0, re10: i % 10 }
                    if (!autoIncrement) Object.assign(value, { id: i })
                    objectStore.add(value)
                }
            })
        })
        expect(await getVersion(databaseName)).toBe(1)
    })
    it("check index names", async () => {
        expect(await getStoreIndexNames(databaseName, autoStoreName)).toEqual(["odd", "re10"])
        expect(await getStoreIndexNames(databaseName, storeName)).toEqual(["odd", "re10"])
    })
})