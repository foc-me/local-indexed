import "fake-indexeddb/auto"
import { getDatabases, deleteDatabase } from "../indexed"
import { upgradeDatabase } from "../upgrade"
import { getStoreNames, storeAction } from "../store"
import { getStoreIndexNames } from "../storeIndex"
import { existsDatabase, getVersion } from "./base"

type Store = { id: number, value: number, odd: boolean, re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("upgrade database", () => {
    it("no database at the beginning", async () => {
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase(databaseName)).toBe(false)
    })
    it("create and upgrade a database", async () => {
        await upgradeDatabase(databaseName, 1, (database) => {
            database.createObjectStore(storeName, {
                keyPath: "id",
                autoIncrement: true
            })
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
        for (let i = 1; i <= 10; i++) {
            await upgradeDatabase(databaseName, i, (database) => {
                database.createObjectStore(`${storeName}-${i}`, {
                    keyPath: "id",
                    autoIncrement: true
                })
            })
            expect(await getVersion(databaseName)).toBe(i)
        }
        const databases = await getDatabases()
        expect(databases.length).toBe(1)
        expect(databases[0].name).toBe(databaseName)
        expect(databases[0].version).toBe(10)
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
        for (let i = 1; i <= 10; i++) {
            for (let j = 1; j <= i; j++) {
                await upgradeDatabase(`${databaseName}-${i}`, j, (database) => {
                    database.createObjectStore(`${storeName}-${j}`, {
                        keyPath: "id",
                        autoIncrement: true
                    })
                })
                expect(await getVersion(`${databaseName}-${i}`)).toBe(j)
            }
        }

        const databases = await getDatabases()
        expect(databases.length).toBe(10)
        for (let i = 0; i < 10; i++) {
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

describe("check objectStore in upgrade callback", () => {
    it("no database at the beginning", async () => {
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase(databaseName)).toBe(false)
    })
    it("check objectStore action", async () => {
        await upgradeDatabase(databaseName, 1, (database) => {
            const objectStore = database.createObjectStore(storeName, {
                keyPath: "id",
                autoIncrement: true
            })
            // createIndex
            objectStore.createIndex("odd", "odd", { unique: false })
            objectStore.createIndex("re10", "re10", { unique: false })
            // indexNames
            expect([...objectStore.indexNames]).toEqual(["odd", "re10"])
            // add
            for (let i = 1; i <= 50; i++) {
                const odd = i % 2 === 0 ? { odd: "odd" } : {}
                objectStore.add(Object.assign({ value: i, re10: i % 10 }, odd))
            }
            // put
            for (let i = 1; i <= 20; i++) {
                const next = i * 10
                const odd = next % 2 === 0 ? { odd: "odd" } : {}
                objectStore.put(Object.assign({ id: i, value: next, re10: next % 10 }, odd))
            }
            // delete
            for (let i = 41; i <= 50; i++) {
                objectStore.delete(i)
            }
        })
    })
    it("check data", async () => {
        expect(await storeAction(databaseName, storeName, (objectStore) => {
            return objectStore.count()
        })).toBe(40)
        for (let i = 1; i <= 40; i++) {
            const item = await storeAction<Store>(databaseName, storeName, (objectStore) => {
                return objectStore.get(i)
            })
            const value = i <= 20 ? i * 10 : i
            const odd = i <= 20 || value % 2 === 0 ? "odd" : undefined
            expect(item.id).toBe(i)
            expect(item.value).toBe(value)
            expect(item.odd).toBe(odd)
            expect(item.re10).toBe(value % 10)
        }
        expect(await getStoreIndexNames(databaseName, storeName)).toEqual(["odd", "re10"])
    })
    it("delete test database", async () => {
        await deleteDatabase(databaseName)
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase(databaseName)).toBe(false)
    })
})

describe("check objectStore in upgrade callback", () => {
    it("no database at the beginning", async () => {
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase(databaseName)).toBe(false)
    })
    it("check objectStore action", async () => {
        await upgradeDatabase(databaseName, 1, (database) => {
            const objectStore = database.createObjectStore(storeName, {
                keyPath: "id",
                autoIncrement: true
            })
            // createIndex
            objectStore.createIndex("odd", "odd", { unique: false })
            objectStore.createIndex("re10", "re10", { unique: false })
            // indexNames
            expect([...objectStore.indexNames]).toEqual(["odd", "re10"])
            // add
            for (let i = 1; i <= 50; i++) {
                const odd = i % 2 === 0 ? { odd: "odd" } : {}
                objectStore.add(Object.assign({ value: i, re10: i % 10 }, odd))
            }
            // deleteIndex
            objectStore.deleteIndex("odd")
            objectStore.deleteIndex("re10")
            // clear
            objectStore.clear()
        })
    })
    it("check data", async () => {
        expect(await storeAction(databaseName, storeName, (objectStore) => {
            return objectStore.count()
        })).toBe(0)
        expect(await getStoreIndexNames(databaseName, storeName)).toEqual([])
    })
    it("delete test database", async () => {
        await deleteDatabase(databaseName)
        expect((await getDatabases()).length).toBe(0)
        expect(await existsDatabase(databaseName)).toBe(false)
    })
})