import "fake-indexeddb/auto"
import { getDatabases, deleteDatabase } from "../indexed"
import { getDatabase } from "../database"

const databaseName = "local-indexed"

describe("check indexed", () => {
    it("check empty indexed", async () => {
        expect((await getDatabases()).length).toBe(0)
    })
    it("check create database", async () => {
        const database = await getDatabase(databaseName)
        database.close()

        const databases = await getDatabases()
        expect(databases.length).toBe(1)
        expect(databases[0].name).toBe(databaseName)
        expect(databases[0].version).toBe(1)
    })
    it("check create 10 databases", async () => {
        for (let i = 1; i <= 10; i++) {
            const database = await getDatabase(`${databaseName}-${i}`)
            database.close()
        }

        const databases = await getDatabases()
        expect(databases.length).toBe(11)
        const first = databases[0]
        expect(first.name).toBe(databaseName)
        expect(first.version).toBe(1)
        for (let i = 1; i <= 10; i++) {
            const { name, version } = databases[i]
            if (!name) throw new Error("name should not be undefined")
            expect(name).toBe(`${databaseName}-${i}`)
            expect(version).toBe(1)
        }
    })
    it("check delete databases", async () => {
        const databases = await getDatabases()
        expect(databases.length).toBe(11)
        await deleteDatabase(databaseName)
        for (let i = 1; i <= 10; i++) {
            const { name } = databases[i]
            if (!name) throw new Error("name should not be undefined")
            await deleteDatabase(name)
        }
        expect((await getDatabases()).length).toBe(0)
    })
})