import { indexedDB } from "fake-indexeddb"
import { useIndexedDB, getDatabases, existsDatabase, deleteDatabase } from "../indexed"
import { getVersion } from "../database"

useIndexedDB(indexedDB)
const databaseName = "local-indexed"
const last = 10

describe("create database", () => {
    it("no database at the beginning", async () => {
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase(databaseName)).toBe(false)
    })
    it("create a test database", async () => {
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

describe("create databases", () => {
    it("no database at the beginning", async () => {
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase(databaseName)).toBe(false)
    })
    it("create test databases", async () => {
        for (let i = 1; i <= last; i++) {
            expect(await getVersion(`${databaseName}-${i}`)).toBe(1)
        }
        const databases = await getDatabases()
        expect(databases.length).toBe(last)
        for (let i = 1; i <= last; i++) {
            const { name, version } = databases[i - 1]
            if (!name) throw new Error("name should not be undefined")
            expect(await existsDatabase(name)).toBe(true)
            expect(name).toBe(`${databaseName}-${i}`)
            expect(version).toBe(1)
        }
    })
    it("delete the test databases", async () => {
        await deleteDatabase(databaseName)
        const databases = await getDatabases()
        expect(databases.length).toBe(last)
        for (let i = 1; i <= last; i++) {
            const { name } = databases[i - 1]
            if (!name) throw new Error("name should not be undefined")
            await deleteDatabase(name)
            expect(await existsDatabase(name)).toBe(false)
        }
        expect((await getDatabases()).length).toBe(0)
    })
})