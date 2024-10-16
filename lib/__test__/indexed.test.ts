import { indexedDB } from "fake-indexeddb"
import { useIndexedDB, getDatabases, existsDatabase, deleteDatabase } from "../indexed"
import { getVersion } from "../database"

useIndexedDB(indexedDB)

describe("fake-indexed", () => {
    it("no database at the beginning", async () => {
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase("local-indexed")).toBe(false)
    })
    it("create a test database", async () => {
        expect(await getVersion("local-indexed")).toBe(1)
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