import "fake-indexeddb/auto"
import { getDatabases, deleteDatabase } from "../indexed"
import { upgradeDatabase } from "../upgrade"
import { getStoreNames } from "../store"
import { existsDatabase, getVersion } from "./base"

const last = 10
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
    it("delete test database", async () => {
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
    it("delete test database", async () => {
        await deleteDatabase(databaseName)
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase(databaseName)).toBe(false)
    })
})

describe("create 10 databases and upgrade each database 10 times", () => {
    it("no database at the beginning", async () => {
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase(databaseName)).toBe(false)
    })
    it("create and upgrade databases", async () => {
        for (let i = 1; i <= last; i++) {
            for (let j = 1; j <= i; j++) {
                await upgradeDatabase(`${databaseName}-${i}`, j, (database) => {
                    database.createObjectStore(`${storeName}-${j}`, storeOption)
                })
                expect(await getVersion(`${databaseName}-${i}`)).toBe(j)
            }
        }

        const databases = await getDatabases()
        expect(databases.length).toBe(last)
        for (let i = 0; i < last; i++) {
            const info = databases[i]
            if (!info.name) throw new Error("name should not be undefined")
            expect(info.name).toBe(`${databaseName}-${i + 1}`)
            expect(info.version).toBe(i + 1)
            expect((await getStoreNames(info.name)).length).toBe(i + 1)
        }
    })
    it("delete test database", async () => {
        const databases = await getDatabases()
        for (const info of databases) {
            if (!info.name) throw new Error("name should not be undefined")
            await deleteDatabase(info.name)
        }
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase(databaseName)).toBe(false)
    })
})