import "fake-indexeddb/auto"
import { getDatabases, existsDatabase, deleteDatabase } from "../indexed"
import { getVersion } from "../database"
import { upgradeDatabase } from "../upgrade"

const databaseName = "local-indexed"
const storeName = "test-store"
const storeOption: IDBObjectStoreParameters = {
    keyPath: "id",
    autoIncrement: true
}

describe("upgrade database", () => {
    it("no database at the beginning", async () => {
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase(databaseName)).toBe(false)
    })
    it("create and upgrade a database", async () => {
        await upgradeDatabase(databaseName, 1, (database) => {
            database.createObjectStore(storeName, storeOption)
        })
        expect(await getVersion(databaseName)).toBe(1)
        const databases = await getDatabases()
        expect(databases.length).toBe(1)
        expect(databases[0].name).toBe(databaseName)
        expect(databases[0].version).toBe(1)
        expect(await existsDatabase(databaseName)).toBe(true)
    })
    it("delete the test database", async () => {
        await deleteDatabase(databaseName)
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase(databaseName)).toBe(false)
    })
})

describe("upgrade database 10 times", () => {
    it("no database at the beginning", async () => {
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase(databaseName)).toBe(false)
    })
    it("create and upgrade a database", async () => {
        const last = 10
        for (let i = 1; i <= last; i++) {
            await upgradeDatabase(databaseName, i, (database) => {
                database.createObjectStore(`${storeName}-${i}`, storeOption)
            })
            expect(await getVersion(databaseName)).toBe(i)
        }
        const databases = await getDatabases()
        expect(databases.length).toBe(1)
        expect(databases[0].name).toBe(databaseName)
        expect(databases[0].version).toBe(last)
        expect(await existsDatabase(databaseName)).toBe(true)
    })
    it("delete the test database", async () => {
        await deleteDatabase(databaseName)
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase(databaseName)).toBe(false)
    })
})