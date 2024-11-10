import "fake-indexeddb/auto"
import { getDatabases, deleteDatabase } from "../indexed"
import { upgradeDatabase } from "../upgrade"

const databaseName = "local-indexed"

describe("check upgrade", () => {
    it("check empty indexed", async () => {
        expect((await getDatabases()).length).toBe(0)
    })
    it("check create database", async () => {
        const event = await upgradeDatabase(databaseName, 1)
        const { transaction, oldVersion, newVersion, origin } = event
        expect(origin instanceof IDBVersionChangeEvent).toBe(true)
        expect(transaction instanceof IDBTransaction).toBe(true)
        expect(oldVersion).toBe(0)
        expect(newVersion).toBe(1)
        transaction.db.close()

        const databases = await getDatabases()
        expect(databases.length).toBe(1)
        expect(databases[0].name).toBe(databaseName)
        expect(databases[0].version).toBe(1)
    })
    it("check upgrade database 10 times", async () => {
        for (let i = 0; i < 10; i++) {
            const prev = i + 1
            const current = i + 2
            const event = await upgradeDatabase(databaseName, current)
            const { transaction, oldVersion, newVersion } = event
            expect(oldVersion).toBe(prev)
            expect(newVersion).toBe(current)
            transaction.db.close()
        }

        const databases = await getDatabases()
        expect(databases.length).toBe(1)
        expect(databases[0].name).toBe(databaseName)
        expect(databases[0].version).toBe(11)
    })
    it("check delete database", async () => {
        await deleteDatabase(databaseName)
        expect((await getDatabases()).length).toBe(0)
    })
})