import "fake-indexeddb/auto"
import { getDatabases, deleteDatabase } from "../indexed"
import { getDatabase } from "../database"
import { upgradeAction } from "../upgrade"

const databaseName = "local-indexed"

describe("check upgrade", () => {
    it("check empty indexed", async () => {
        expect((await getDatabases()).length).toBe(0)
    })
    it("check create database", async () => {
        await upgradeAction(databaseName, 1, (event) => {
            const { transaction, oldVersion, newVersion, origin } = event
            expect(origin instanceof IDBVersionChangeEvent).toBe(true)
            expect(transaction instanceof IDBTransaction).toBe(true)
            expect(oldVersion).toBe(0)
            expect(newVersion).toBe(1)
        })

        const databases = await getDatabases()
        expect(databases.length).toBe(1)
        expect(databases[0].name).toBe(databaseName)
        expect(databases[0].version).toBe(1)
    })
    it("check upgrade database 10 times", async () => {
        for (let i = 0; i < 10; i++) {
            const prev = i + 1
            const current = i + 2
            await upgradeAction(databaseName, current, (event) => {
                const { oldVersion, newVersion } = event
                expect(oldVersion).toBe(prev)
                expect(newVersion).toBe(current)
            })
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