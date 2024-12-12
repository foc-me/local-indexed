import { indexedDB } from "fake-indexeddb"
import localIndexed from "../../indexed"

const databaseName = "local-indexed"

describe("check localIndexed static apis", () => {
    it("check no indexeddb error", async () => {
        await expect(() => localIndexed.databases()).rejects.toThrow("indexedDB is not defined")
        await expect(() => localIndexed.databases()).rejects.toThrow(ReferenceError)
        await expect(() => localIndexed.deleteDatabase(databaseName)).rejects.toThrow("indexedDB is not defined")
        await expect(() => localIndexed.deleteDatabase(databaseName)).rejects.toThrow(ReferenceError)
        await expect(() => localIndexed.exists(databaseName)).rejects.toThrow("indexedDB is not defined")
        await expect(() => localIndexed.exists(databaseName)).rejects.toThrow(ReferenceError)
        await expect(() => localIndexed.version(databaseName)).rejects.toThrow("indexedDB is not defined")
        await expect(() => localIndexed.version(databaseName)).rejects.toThrow(ReferenceError)
    })
    it("check use", async () => {
        localIndexed.use(indexedDB)
        expect(await localIndexed.databases()).toEqual([])
        expect(await localIndexed.exists(databaseName)).toBe(false)
        expect(await localIndexed.version(databaseName)).toBe(0)
    })
    it("check create", async () => {
        for (let i = 0; i < 10; i++) {
            const indexed = localIndexed(databaseName + `-${i}`)
            for (let j = 0; j < i; j++) {
                expect(await indexed.upgrade(() => {})).toBe(undefined)
                expect(await indexed.version()).toBe(j + 1)
            }
        }
    })
    it("check databases", async () => {
        const databases = await localIndexed.databases()
        expect(databases.length).toBe(9)
        databases.forEach((database, index) => {
            expect(database.name).toBe(databaseName + `-${index + 1}`)
            expect(database.version).toBe(index + 1)
        })
    })
    it("check exists", async () => {
        for (let i = 0; i < 10; i++) {
            expect(await localIndexed.exists(databaseName + `-${i}`)).toBe(i !== 0)
        }
    })
    it("check version", async () => {
        for (let i = 0; i < 10; i++) {
            expect(await localIndexed.version(databaseName + `-${i}`)).toBe(i)
        }
    })
    it("check deleteDatabase", async () => {
        for (let i = 0; i < 10; i++) {
            expect(await localIndexed.deleteDatabase(databaseName + `-${i}`)).toBe(true)
        }
        expect(await localIndexed.databases()).toEqual([])
    })
})