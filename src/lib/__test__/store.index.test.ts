import "fake-indexeddb/auto"
import { storeAction } from "../store"
import { upgradeDatabase } from "../upgrade"
import { deleteDatabase } from "../indexed"
import { getStoreIndexNames } from "../storeIndex"
import { getVersion } from "./base"

const databaseName = "local-indexed"
const storeName = "test-store"

describe("object store index", () => {
    it("check createIndex", async () => {
        expect(await getVersion(databaseName)).toBe(0)
        await upgradeDatabase(databaseName, 1, (database) => {
            const objectStore = database.createObjectStore(storeName, {
                keyPath: "id",
                autoIncrement: true
            })
            objectStore.createIndex("odd", "odd", { unique: false })
            objectStore.createIndex("re10", "re10", { unique: false })
        })
        expect(await getVersion(databaseName)).toBe(1)
    })
    it("check index", async () => {
        expect(await getStoreIndexNames(databaseName, storeName)).toEqual(["odd", "re10"])
        await storeAction(databaseName, storeName, (objectStore) => {
            const odd = objectStore.index("odd")
            expect(odd instanceof IDBIndex).toBe(true)
            expect(odd.name).toBe("odd")

            const re10 = objectStore.index("re10")
            expect(re10 instanceof IDBIndex).toBe(true)
            expect(re10.name).toBe("re10")
        })
    })
    it("delete databse", async () => {
        await deleteDatabase(databaseName)
        expect(await getVersion(databaseName)).toBe(0)
    })
    it("check deleteIndex", async () => {
        expect(await getVersion(databaseName)).toBe(0)
        await upgradeDatabase(databaseName, 1, (database) => {
            const objectStore = database.createObjectStore(storeName, {
                keyPath: "id",
                autoIncrement: true
            })

            objectStore.createIndex("odd", "odd", { unique: false })
            objectStore.createIndex("re10", "re10", { unique: false })

            objectStore.deleteIndex("odd")
            objectStore.deleteIndex("re10")
        })
        expect(await getVersion(databaseName)).toBe(1)
        expect(await getStoreIndexNames(databaseName, storeName)).toEqual([])
    })
    it("delete databse", async () => {
        await deleteDatabase(databaseName)
        expect(await getVersion(databaseName)).toBe(0)
    })
})