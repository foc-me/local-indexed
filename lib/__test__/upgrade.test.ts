import "fake-indexeddb/auto"
import { getDatabases, existsDatabase, deleteDatabase } from "../indexed"
import { getDatabaseVersion } from "../database"
import { upgradeDatabase, type LDBStoreOption } from "../upgrade"

const storeOption: LDBStoreOption = {
    keyPath: "id",
    autoIncrement: true,
    index: {
        name: { unique: false }
    }
}

describe("upgrade database", () => {
    it("no database at the beginning", async () => {
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase("local-indexed")).toBe(false)
    })
    it("create and upgrade a database", async () => {
        await upgradeDatabase("local-indexed", 1, (context) => {
            context.createStore("testStore", storeOption)
        })
        expect(await getDatabaseVersion("local-indexed")).toBe(1)
        const databases = await getDatabases()
        expect(databases.length).toBe(1)
        expect(databases[0].name).toBe("local-indexed")
        expect(databases[0].version).toBe(1)
        expect(await existsDatabase("local-indexed")).toBe(true)
    })
    it("delete the test database", async () => {
        await deleteDatabase("local-indexed")
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase("local-indexed")).toBe(false)
    })
})

describe("upgrade database 10 times", () => {
    it("no database at the beginning", async () => {
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase("local-indexed")).toBe(false)
    })
    it("create and upgrade a database", async () => {
        const last = 10
        for (let i = 1; i <= last; i++) {
            await upgradeDatabase("local-indexed", i, (context) => {
                context.createStore(`testStore-${i}`, storeOption)
            })
            expect(await getDatabaseVersion("local-indexed")).toBe(i)
        }
        const databases = await getDatabases()
        expect(databases.length).toBe(1)
        expect(databases[0].name).toBe("local-indexed")
        expect(databases[0].version).toBe(last)
        expect(await existsDatabase("local-indexed")).toBe(true)
    })
    it("delete the test database", async () => {
        await deleteDatabase("local-indexed")
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase("local-indexed")).toBe(false)
    })
})