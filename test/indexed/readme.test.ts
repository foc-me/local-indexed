import "fake-indexeddb/auto"
import { indexedDB } from "fake-indexeddb"
import localIndexed from "../../src/indexed"

type Store = { id: number, type: string }

afterEach(async () => {
    await localIndexed.delete("database")
})

describe("check readme", () => {
    it("check localIndexed.use", () => {
        expect(localIndexed.use(indexedDB)).toBe(undefined)
    })
    it("check localIndexed.databases", async () => {
        await localIndexed("database").upgrade()
        expect(await localIndexed.databases()).toEqual([{ name: "database", version: 1 }])
    })
    it("check localIndexed.delete", async () => {
        await localIndexed("database").upgrade()
        expect(await localIndexed.delete("database")).toBe(true)
    })
    it("check localIndexed.exists", async () => {
        await localIndexed("database").upgrade()
        expect(await localIndexed.exists("database")).toBe(true)
    })
    it("check localIndexed.version", async () => {
        expect(await localIndexed.version("database")).toBe(0)
        await localIndexed("database").upgrade()
        expect(await localIndexed.version("database")).toBe(1)
    })
    it("check localIndexed", () => {
        const indexed = localIndexed("database")
        expect(typeof indexed.abort).toBe("function")
        expect(typeof indexed.close).toBe("function")
        expect(typeof indexed.collection).toBe("function")
        expect(typeof indexed.stores).toBe("function")
        expect(typeof indexed.transaction).toBe("function")
        expect(typeof indexed.upgrade).toBe("function")
        expect(typeof indexed.version).toBe("function")
    })
    it("check LDBIndexed.name", () => {
        const indexed = localIndexed("database")
        expect(indexed.name).toBe("database")
    })
    it("check LDBIndexed.version", async () => {
        const indexed = localIndexed("database")
        await indexed.upgrade()
        expect(await indexed.version()).toBe(1)
    })
    it("check LDBIndexed.stores", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        await indexed.upgrade(() => {
            store.create()
        })
        expect(await indexed.stores()).toEqual(["store"])
    })
    it("check LDBIndexed.upgrade", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.version()).toBe(0)
        await indexed.upgrade()
        await indexed.upgrade()
        expect(await indexed.version()).toBe(2)
        expect(await indexed.upgrade((event) => {
            expect(event.oldVersion).toBe(2)
            expect(event.newVersion).toBe(3)
            store.create({ keyPath: "id" })
        })).toBe(undefined)
        expect(await indexed.upgrade(async (event) => {
            expect(event.oldVersion).toBe(3)
            expect(event.newVersion).toBe(4)
            await store.insert({ id: 1, name: "test" })
        })).toBe(undefined)
        expect(await indexed.version()).toBe(4)
    })
    it("check LDBIndexed.upgrade2 example 1", async () => {
        const indexed = localIndexed("database")
        expect(await indexed.upgrade()).toBe(undefined)
        await expect(indexed.upgrade(1, () => {})).rejects.toThrow(Error)
        expect(await indexed.upgrade(5, () => {})).toBe(undefined)
        expect(await indexed.version()).toBe(5)
    })
    it("check LDBIndexed.upgrade2 example 2", async () => {
        const indexed = localIndexed("database")
        const classes = indexed.collection("classes")
        const classmates = indexed.collection("classmates")
        expect(await indexed.upgrade(async () => {
            expect(classes.create({ keyPath: "id" })).toBe(true)
            expect(classmates.create({ keyPath: "id" })).toBe(true)
            expect(classes.createIndex("grade")).toBe(true)
            expect(classmates.createIndex("age")).toBe(true)
            expect(classmates.createIndex("birth")).toBe(true)
            expect(await classes.insert([{ id: 1, grade: 1 }])).toEqual([1])
            expect(await classmates.insert([{ id: 1, age: 9, birth: new Date("1998-12-10") }])).toEqual([1])
        })).toBe(undefined)
    })
    it("check LDBIndexed.upgrade2 example 3", async () => {
        const indexed = localIndexed("database")
        const classes = indexed.collection("classes")
        const classmates = indexed.collection("classmates")
        expect(await indexed.upgrade(async () => {
            expect(classes.create()).toBe(true)
            expect(classmates.create()).toBe(true)
        })).toBe(undefined)
        expect(await indexed.upgrade(async () => {
            const classesList = await classes.find()
            const classmatesList = await classmates.find()
            expect(classesList).toEqual([])
            expect(classmatesList).toEqual([])
            expect(classes.alter({
                keyPath: "grade",
                autoIncrement: true,
                indexes: {
                    grade: { unique: false }
                }
            })).toBe(true)
            expect(classmates.alter({
                keyPath: "id",
                autoIncrement: true,
                indexes: {
                    age: { unique: false },
                    birth: { unique: false }
                }
            })).toBe(true)
            expect(await classes.insert(classesList.map(item => ({})))).toEqual([])
            expect(await classmates.insert(classmatesList.map(item => ({})))).toEqual([])
        })).toBe(undefined)
    })
    it("check LDBIndexed.upgrade2 example 4", async () => {
        const indexed = localIndexed("database")
        const classmates = indexed.collection("classmates")
        expect(await indexed.upgrade(async () => {
            expect(classmates.create()).toBe(true)
        })).toBe(undefined)
        expect(await indexed.upgrade(async () => {
            const cursor = classmates.find(() => true)
            expect(typeof cursor.count).toBe("function")
            expect(typeof cursor.remove).toBe("function")
            expect(typeof cursor.toList).toBe("function")
            expect(typeof cursor.update).toBe("function")
            expect(await cursor.update(() => ({}))).toEqual([])
        })).toBe(undefined)
    })
    it("check LDBIndexed.upgrade2 example 5", async () => {
        const indexed = localIndexed("database")
        expect(await indexed.upgrade()).toBe(undefined)
        expect(await indexed.upgrade()).toBe(undefined)
        expect(await indexed.upgrade()).toBe(undefined)
        expect(await indexed.upgrade(async (event) => {
            expect(event.oldVersion).toBe(3)
            expect(event.newVersion).toBe(4)
            indexed.abort()
        })).toBe(undefined)
        expect(await indexed.version()).toBe(3)
    })
    it("check LDBIndexed.transaction example 1", async () => {
        const indexed = localIndexed("database")
        const classes = indexed.collection("classes")
        const classmates = indexed.collection("classmates")
        expect(await indexed.upgrade(async () => {
            expect(classes.alter({ keyPath: "grade", autoIncrement: true })).toBe(true)
            expect(classmates.alter({ keyPath: "id", autoIncrement: true })).toBe(true)
        })).toBe(undefined)
        expect(await indexed.transaction(async () => {
            expect(await classmates.insert({ id: 1, name: "John" })).toBe(1)
            expect(await classmates.update([{ id: 1, name: "Joe" }, { id: 2, name: "Anny" }])).toEqual([1, 2])
            expect(await classmates.remove([1, 2])).toBe(undefined)
            expect(await classmates.find()).toEqual([])
            const cursor = classmates.find(() => true)
            expect(typeof cursor.count).toBe("function")
            expect(typeof cursor.remove).toBe("function")
            expect(typeof cursor.toList).toBe("function")
            expect(typeof cursor.update).toBe("function")
        })).toBe(undefined)
    })
    it("check LDBIndexed.transaction example 2", async () => {
        const indexed = localIndexed("database")
        expect(await indexed.stores()).toEqual([])
        await expect(indexed.transaction(() => {
            console.log("will not console and throw")
            throw new Error()
        })).rejects.toThrow("An invalid operation was performed on an object. For example transaction creation attempt was made, but an empty scope was provided.")
    })
    it("check LDBIndexed.transaction example 3", async () => {
        const indexed = localIndexed("database")
        const classmates = indexed.collection("classmates")
        expect(await indexed.upgrade(async () => {
            expect(classmates.create({ keyPath: "id", autoIncrement: true })).toBe(true)
            expect(await classmates.insert([
                { name: "John", grade: 1, birth: new Date("2000/01/05") },
                { name: "Anny", grade: 1, birth: new Date("2000/04/17") },
            ])).toEqual([1, 2])
        })).toBe(undefined)
        expect(await indexed.transaction(async () => {
            const cursor = classmates.find(() => true)
            expect(await cursor.remove()).toBe(2)
            expect(await classmates.find()).toEqual([])
            indexed.abort()
        })).toBe(undefined)
        const list = await classmates.find()
        expect(list.length).toBe(2)
        expect(list[0]).toEqual({ id: 1, name: "John", grade: 1, birth: new Date("2000/01/05") })
        expect(list[1]).toEqual({ id: 2, name: "Anny", grade: 1, birth: new Date("2000/04/17") })
    })
    it("check LDBIndexed.abort example 1", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(async () => {
            expect(store.create()).toBe(true)
        })).toBe(undefined)
        expect(await indexed.upgrade(async () => {
            try {
                throw new Error("")
            } catch (error) {
                expect(indexed.abort()).toBe(undefined)
            }
        })).toBe(undefined)
        expect(await indexed.transaction(async () => {
            try {
                throw new Error("")
            } catch (error) {
                expect(indexed.abort()).toBe(undefined)
            }
        })).toBe(undefined)
    })
    it("check LDBIndexed.abort example 2", async () => {
        const indexed = localIndexed("database")
        expect(() => indexed.abort()).toThrow("localIndexed.abort requires transaction or upgrade")
    })
    it("check LDBIndexed.collectio", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(typeof store.alter).toBe("function")
        expect(typeof store.create).toBe("function")
        expect(typeof store.createIndex).toBe("function")
        expect(typeof store.drop).toBe("function")
        expect(typeof store.dropIndex).toBe("function")
        expect(typeof store.find).toBe("function")
        expect(typeof store.info).toBe("function")
        expect(typeof store.insert).toBe("function")
        expect(typeof store.remove).toBe("function")
        expect(typeof store.update).toBe("function")
    })
    it("check LDBCollection.info", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: false })).toBe(true)
            expect(store.createIndex("index_name", { keyPath: "name", unique: false })).toBe(true)
            expect(store.createIndex("index_number", { keyPath: "number", unique: true })).toBe(true)
        })).toBe(undefined)
        const info = await store.info()
        expect(info.name).toBe("store")
        expect(info.keyPath).toBe("id")
        expect(info.autoIncrement).toBe(false)
        expect(Object.keys(info.indexes)).toEqual(["index_name", "index_number"])
        expect(info.indexes["index_name"]).toEqual({ name: "index_name", keyPath: "name", unique: false, multiEntry: false })
        expect(info.indexes["index_number"]).toEqual({ name: "index_number", keyPath: "number", unique: true, multiEntry: false })
    })
    it("check LDBCollection.exists", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await store.exists()).toBe(false)
        await indexed.upgrade(() => {
            store.create()
        })
        expect(await store.exists()).toBe(true)
    })
    it("check LDBCollection.create example 1", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({
                keyPath: "id",
                autoIncrement: false,
                indexes: {
                    key1: { keyPath: "key1", unique: true },
                    key2: { keyPath: "key2", unique: false }
                }
            })).toBe(true)
        })).toBe(undefined)
        expect(await indexed.stores()).toEqual(["store"])
    })
    it("check LDBCollection.create example 2", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create()).toBe(true)
            expect(() => store.create()).toThrow("objectStore 'store' already exists")
        })).toBe(undefined)
    })
    it("check LDBCollection.drop example 1", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create()).toBe(true)
        })).toBe(undefined)
        expect(await indexed.stores()).toEqual(["store"])
        expect(await indexed.upgrade(() => {
            expect(store.drop()).toBe(true)
        }))
        expect(await indexed.stores()).toEqual([])
    })
    it("check LDBCollection.drop example 2", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(() => store.drop()).toThrow("The operation failed because the requested database object could not be found. For example, an object store did not exist but was being opened.")
        })).toBe(undefined)
    })
    it("check LDBCollection.alter", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(async () => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
            expect(await store.insert([{ name: "name1" }, { name: "name2" }])).toEqual([1, 2])
        })).toBe(undefined)
        expect(await indexed.upgrade(async () => {
            const storeList = await store.find()
            expect(storeList).toEqual([{ id: 1, name: "name1" }, { id: 2, name: "name2" }])
            expect(store.alter({ keyPath: "id" })).toBe(true)
            expect(await store.insert(storeList)).toEqual([1, 2])
        })).toBe(undefined)
    })
    it("check LDBCollection.createIndex", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create()).toBe(true)
            expect(store.createIndex("key1", { keyPath: "key1", unique: false })).toBe(true)
        })).toBe(undefined)
        const info = await store.info()
        expect(info.indexes["key1"].name).toBe("key1")
        expect(info.indexes["key1"].keyPath).toBe("key1")
        expect(info.indexes["key1"].unique).toBe(false)
        expect(info.indexes["key1"].multiEntry).toBe(false)
    })
    it("check LDBCollection.dropIndex", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create()).toBe(true)
            expect(store.createIndex("key1", { keyPath: "key1", unique: false })).toBe(true)
        })).toBe(undefined)
        expect(await indexed.upgrade(() => {
            expect(store.dropIndex("key1")).toBe(true)
        })).toBe(undefined)
        const info = await store.info()
        expect(info.indexes).toEqual({})
    })
    it("check LDBCollection.insert example 1", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert({ name: "name1", type: "type1" })).toBe(1)
        const list = await store.find()
        expect(list).toEqual([{ id: 1, name: "name1", type: "type1" }])
    })
    it("check LDBCollection.insert example 2", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert({ name: "name1", type: "type1" })).toBe(1)
        const list = await store.find()
        expect(list).toEqual([{ id: 1, name: "name1", type: "type1" }])
        await expect(store.insert({ id: 1, name: "name1", type: "type1" })).rejects.toThrow(Error)
    })
    it("check LDBCollection.insert2", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert([
            { name: "name1", type: "type1" },
            { name: "name2", type: "type2" }
        ])).toEqual([1, 2])
        const list = await store.find()
        expect(list.length).toBe(2)
        expect(list[0]).toEqual({ id: 1, name: "name1", type: "type1" })
        expect(list[1]).toEqual({ id: 2, name: "name2", type: "type2" })
    })
    it("check LDBCollection.update example 1", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert({ name: "name1", type: "type1" })).toBe(1)
        expect(await store.find()).toEqual([{ id: 1, name: "name1", type: "type1" }])
        expect(await store.update({ id: 1, name: "name2", type: "type2" })).toBe(1)
        expect(await store.find()).toEqual([{ id: 1, name: "name2", type: "type2" }])
    })
    it("check LDBCollection.update example 2", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        await indexed.upgrade(() => {
            store.create({ keyPath: "id", autoIncrement: true })
        })
        expect(await store.insert({ name: "name1", type: "type1" })).toBe(1)
        expect(await store.find()).toEqual([{ id: 1, name: "name1", type: "type1" }])
        expect(await store.update({ id: 2, name: "name2", type: "type2" })).toBe(2)
        const updateList = await store.find()
        expect(updateList.length).toEqual(2)
        expect(updateList[0]).toEqual({ id: 1, name: "name1", type: "type1" })
        expect(updateList[1]).toEqual({ id: 2, name: "name2", type: "type2" })
    })
    it("check LDBCollection.update2", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert([
            { name: "name1", type: "type1" },
            { name: "name2", type: "type2" }
        ])).toEqual([1, 2])
        const list = await store.find()
        expect(list.length).toBe(2)
        expect(list[0]).toEqual({ id: 1, name: "name1", type: "type1" })
        expect(list[1]).toEqual({ id: 2, name: "name2", type: "type2" })
        expect(await store.update([
            { id: 1, name: "updateName1", type: "updateType1" },
            { id: 2, name: "updateName2", type: "updateType2" }
        ])).toEqual([1, 2])
        const updateList = await store.find()
        expect(updateList.length).toBe(2)
        expect(updateList[0]).toEqual({ id: 1, name: "updateName1", type: "updateType1" })
        expect(updateList[1]).toEqual({ id: 2, name: "updateName2", type: "updateType2" })
    })
    it("check LDBCollection.remove", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert({ name: "name1", type: "type1" })).toBe(1)
        expect(await store.find()).toEqual([{ id: 1, name: "name1", type: "type1" }])
        expect(await store.remove(1)).toBe(undefined)
        expect(await store.find()).toEqual([])
    })
    it("check LDBCollection.remove2", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert([
            { name: "name1", type: "type1" },
            { name: "name2", type: "type2" }
        ])).toEqual([1, 2])
        const list = await store.find()
        expect(list.length).toBe(2)
        expect(list[0]).toEqual({ id: 1, name: "name1", type: "type1" })
        expect(list[1]).toEqual({ id: 2, name: "name2", type: "type2" })
        expect(await store.remove([1, 2])).toBe(undefined)
        expect(await store.find()).toEqual([])
    })
    it("check LDBCollection.remove3", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert([
            { name: "name1", type: "type1" },
            { name: "name2", type: "type2" },
            { name: "name3", type: "type3" },
            { name: "name4", type: "type4" },
            { name: "name5", type: "type5" }
        ])).toEqual([1, 2, 3, 4, 5])
        const list = await store.find()
        expect(list.length).toBe(5)
        await store.remove(IDBKeyRange.bound(1, 5))
        expect(await store.find()).toEqual([])
    })
    it("check LDBCollection.find", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert([
            { name: "name1", type: "type1" },
            { name: "name2", type: "type2" },
            { name: "name3", type: "type3" },
            { name: "name4", type: "type4" },
            { name: "name5", type: "type5" }
        ])).toEqual([1, 2, 3, 4, 5])
        const list = await store.find()
        expect(list.length).toBe(5)
        expect(list[0]).toEqual({ id: 1, name: "name1", type: "type1" })
        expect(list[1]).toEqual({ id: 2, name: "name2", type: "type2" })
        expect(list[2]).toEqual({ id: 3, name: "name3", type: "type3" })
        expect(list[3]).toEqual({ id: 4, name: "name4", type: "type4" })
        expect(list[4]).toEqual({ id: 5, name: "name5", type: "type5" })
    })
    it("check LDBCollection.find2 example 1", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert([
            { name: "name1", type: "type1" },
            { name: "name2", type: "type2" },
            { name: "name3", type: "type3" },
            { name: "name4", type: "type4" },
            { name: "name5", type: "type5" }
        ])).toEqual([1, 2, 3, 4 , 5])
        expect(await store.find(1)).toEqual([{ id: 1, name: "name1", type: "type1" }])
        expect(await store.find(1, 10)).toEqual([{ id: 1, name: "name1", type: "type1" }])
    })
    it("check LDBCollection.find2 example 1", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert([
            { name: "name1", type: "type1" },
            { name: "name2", type: "type2" },
            { name: "name3", type: "type3" },
            { name: "name4", type: "type4" },
            { name: "name5", type: "type5" }
        ])).toEqual([1, 2, 3, 4, 5])
        const list = await store.find(IDBKeyRange.bound(1, 5))
        expect(list.length).toBe(5)
        expect(list[0]).toEqual({ id: 1, name: "name1", type: "type1" })
        expect(list[1]).toEqual({ id: 2, name: "name2", type: "type2" })
        expect(list[2]).toEqual({ id: 3, name: "name3", type: "type3" })
        expect(list[3]).toEqual({ id: 4, name: "name4", type: "type4" })
        expect(list[4]).toEqual({ id: 5, name: "name5", type: "type5" })
        const countList = await store.find(IDBKeyRange.bound(1, 5), 2)
        expect(countList.length).toBe(2)
        expect(list[0]).toEqual({ id: 1, name: "name1", type: "type1" })
        expect(list[1]).toEqual({ id: 2, name: "name2", type: "type2" })
    })
    it("check LDBCollection.find3", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert([
            { name: "name1", type: "type1" },
            { name: "name2", type: "type2" },
            { name: "name3", type: "type3" },
            { name: "name4", type: "type4" },
            { name: "name5", type: "type5" }
        ])).toEqual([1, 2, 3, 4, 5])
        const list = await store.find([1, 2, 3, 4, 5])
        expect(list.length).toBe(5)
        expect(list[0]).toEqual({ id: 1, name: "name1", type: "type1" })
        expect(list[1]).toEqual({ id: 2, name: "name2", type: "type2" })
        expect(list[2]).toEqual({ id: 3, name: "name3", type: "type3" })
        expect(list[3]).toEqual({ id: 4, name: "name4", type: "type4" })
        expect(list[4]).toEqual({ id: 5, name: "name5", type: "type5" })
    })
    it("check LDBCollection.find4", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        const cursor = store.find(() => true)
        expect(typeof cursor.count).toBe("function")
        expect(typeof cursor.remove).toBe("function")
        expect(typeof cursor.toList).toBe("function")
        expect(typeof cursor.update).toBe("function")
    })
    it("check LDBCollection.find5 example 1", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert([
            { name: "name1", type: "type1" },
            { name: "name2", type: "type2" },
            { name: "name3", type: "type3" },
            { name: "name4", type: "type4" },
            { name: "name5", type: "type5" }
        ])).toEqual([1, 2, 3, 4, 5])
        const cursor = store.find({ filter: () => true })
        const list = await cursor.toList()
        expect(list.length).toBe(5)
        expect(list[0]).toEqual({ id: 1, name: "name1", type: "type1" })
        expect(list[1]).toEqual({ id: 2, name: "name2", type: "type2" })
        expect(list[2]).toEqual({ id: 3, name: "name3", type: "type3" })
        expect(list[3]).toEqual({ id: 4, name: "name4", type: "type4" })
        expect(list[4]).toEqual({ id: 5, name: "name5", type: "type5" })
    })
    it("check LDBCollection.find5 example 2", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
            expect(store.createIndex("type", { keyPath: "type", unique: false })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert([
            { name: "name1", type: "type1" },
            { name: "name2", type: "type2" },
            { name: "name3", type: "type3" },
            { name: "name4" },
            { name: "name5" }
        ])).toEqual([1, 2, 3, 4, 5])
        const cursor = store.find({ filter: () => true })
        const list = await cursor.toList()
        expect(list.length).toBe(5)
        expect(list[0]).toEqual({ id: 1, name: "name1", type: "type1" })
        expect(list[1]).toEqual({ id: 2, name: "name2", type: "type2" })
        expect(list[2]).toEqual({ id: 3, name: "name3", type: "type3" })
        expect(list[3]).toEqual({ id: 4, name: "name4" })
        expect(list[4]).toEqual({ id: 5, name: "name5" })
        const indexCursor = store.find({ filter: () => true, sort: "type" })
        const indexList = await indexCursor.toList()
        expect(indexList.length).toBe(3)
        expect(indexList[0]).toEqual({ id: 1, name: "name1", type: "type1" })
        expect(indexList[1]).toEqual({ id: 2, name: "name2", type: "type2" })
        expect(indexList[2]).toEqual({ id: 3, name: "name3", type: "type3" })
    })
    it("check LDBCollection.find5 example 3", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
            expect(store.createIndex("type", { keyPath: "type", unique: false })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert([
            { name: "name1", type: "type1" },
            { name: "name2", type: "type2" },
            { name: "name3", type: "type1" },
            { name: "name4", type: "type2" },
            { name: "name5", type: "type1" }
        ])).toEqual([1, 2, 3, 4, 5])
        const cursor = store.find({ filter: () => true })
        const list = await cursor.toList()
        expect(list.length).toBe(5)
        expect(list[0]).toEqual({ id: 1, name: "name1", type: "type1" })
        expect(list[1]).toEqual({ id: 2, name: "name2", type: "type2" })
        expect(list[2]).toEqual({ id: 3, name: "name3", type: "type1" })
        expect(list[3]).toEqual({ id: 4, name: "name4", type: "type2" })
        expect(list[4]).toEqual({ id: 5, name: "name5", type: "type1" })
        const prevCursor = store.find({ filter: () => true, order: "prev" })
        const prevList = await prevCursor.toList()
        expect(prevList.length).toBe(5)
        expect(prevList[0]).toEqual({ id: 5, name: "name5", type: "type1" })
        expect(prevList[1]).toEqual({ id: 4, name: "name4", type: "type2" })
        expect(prevList[2]).toEqual({ id: 3, name: "name3", type: "type1" })
        expect(prevList[3]).toEqual({ id: 2, name: "name2", type: "type2" })
        expect(prevList[4]).toEqual({ id: 1, name: "name1", type: "type1" })
        const indexCursor = store.find({ filter: () => true, sort: "type" })
        const indexList = await indexCursor.toList()
        expect(indexList.length).toBe(5)
        expect(indexList[0]).toEqual({ id: 1, name: "name1", type: "type1" })
        expect(indexList[1]).toEqual({ id: 3, name: "name3", type: "type1" })
        expect(indexList[2]).toEqual({ id: 5, name: "name5", type: "type1" })
        expect(indexList[3]).toEqual({ id: 2, name: "name2", type: "type2" })
        expect(indexList[4]).toEqual({ id: 4, name: "name4", type: "type2" })
        const indexPrevCursor = store.find({ filter: () => true, sort: "type", order: "prev" })
        const indexPrevList = await indexPrevCursor.toList()
        expect(indexPrevList.length).toBe(5)
        expect(indexPrevList[0]).toEqual({ id: 4, name: "name4", type: "type2" })
        expect(indexPrevList[1]).toEqual({ id: 2, name: "name2", type: "type2" })
        expect(indexPrevList[2]).toEqual({ id: 5, name: "name5", type: "type1" })
        expect(indexPrevList[3]).toEqual({ id: 3, name: "name3", type: "type1" })
        expect(indexPrevList[4]).toEqual({ id: 1, name: "name1", type: "type1" })
    })
    it("check LDBCursor.update example 1", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection<Store>("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
            expect(store.createIndex("type", { keyPath: "type", unique: false })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert([
            { name: "name1", type: "type1" },
            { name: "name2", type: "type2" },
            { name: "name3", type: "type1" },
            { name: "name4", type: "type2" },
            { name: "name5", type: "type1" }
        ])).toEqual([1, 2, 3, 4, 5])
        const cursor = store.find(item => item.id < 4)
        expect(await cursor.update(item => {
            const { id } = item
            if (id < 3) {
                return { id, name: `updateName${id}`, type: `updateType${id}` }
            }
        })).toEqual([1, 2])
        const list = await store.find()
        expect(list.length).toBe(5)
        expect(list[0]).toEqual({ id: 1, name: "updateName1", type: "updateType1" })
        expect(list[1]).toEqual({ id: 2, name: "updateName2", type: "updateType2" })
        expect(list[2]).toEqual({ id: 3, name: "name3", type: "type1" })
        expect(list[3]).toEqual({ id: 4, name: "name4", type: "type2" })
        expect(list[4]).toEqual({ id: 5, name: "name5", type: "type1" })
    })
    it("check LDBCursor.update example 2", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection<Store>("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
            expect(store.createIndex("type", { keyPath: "type", unique: false })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert([
            { name: "name1", type: "type1" },
            { name: "name2", type: "type2" },
            { name: "name3", type: "type1" },
            { name: "name4", type: "type2" },
            { name: "name5", type: "type1" }
        ])).toEqual([1, 2, 3, 4, 5])
        const cursor = store.find(item => item.id < 4)
        expect(await cursor.update(item => {
            if (item.id === 1) {
                return { id: 1, name: "updateName1", type: "updateType1" }
            } else {
                return true
            }
        })).toEqual([1])
        const list = await store.find()
        expect(list.length).toBe(5)
        expect(list[0]).toEqual({ id: 1, name: "updateName1", type: "updateType1" })
        expect(list[1]).toEqual({ id: 2, name: "name2", type: "type2" })
        expect(list[2]).toEqual({ id: 3, name: "name3", type: "type1" })
        expect(list[3]).toEqual({ id: 4, name: "name4", type: "type2" })
        expect(list[4]).toEqual({ id: 5, name: "name5", type: "type1" })
    })
    it("check LDBCursor.remove", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection<Store>("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert([
            { name: "name1", type: "type1" },
            { name: "name2", type: "type2" },
            { name: "name3", type: "type1" },
            { name: "name4", type: "type2" },
            { name: "name5", type: "type1" }
        ])).toEqual([1, 2, 3, 4, 5])
        const cursor = store.find(item => item.id < 4)
        expect(await cursor.remove()).toBe(3)
        const list = await store.find()
        expect(list.length).toBe(2)
        expect(list[0]).toEqual({ id: 4, name: "name4", type: "type2" })
        expect(list[1]).toEqual({ id: 5, name: "name5", type: "type1" })
    })
    it("check LDBCursor.toList", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection<Store>("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert([
            { name: "name1", type: "type1" },
            { name: "name2", type: "type2" },
            { name: "name3", type: "type1" },
            { name: "name4", type: "type2" },
            { name: "name5", type: "type1" },
            { name: "name6", type: "type2" },
            { name: "name7", type: "type1" },
            { name: "name8", type: "type2" },
            { name: "name8", type: "type1" },
            { name: "name10", type: "type2" }
        ])).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        const list = await store.find(() => true).toList()
        expect(list.length).toBe(10)
        expect(list.map(item => item.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        const list1 = await store.find(() => true).toList(5)
        expect(list1.length).toBe(5)
        expect(list1.map(item => item.id)).toEqual([1, 2, 3, 4, 5])
        const list2 = await store.find(() => true).toList(5, 3)
        expect(list2.length).toBe(5)
        expect(list2.map(item => item.id)).toEqual([4, 5, 6, 7, 8])
        const list3 = await store.find(item => item.type === "type1").toList()
        expect(list3.length).toBe(5)
        expect(list3.map(item => item.id)).toEqual([1, 3, 5, 7, 9])
        const list4 = await store.find(item => item.type === "type1").toList(3)
        expect(list4.length).toBe(3)
        expect(list4.map(item => item.id)).toEqual([1, 3, 5])
        const list5 = await store.find(item => item.type === "type1").toList(3, 2)
        expect(list5.length).toBe(3)
        expect(list5.map(item => item.id)).toEqual([5, 7, 9])
    })
    it("check LDBCursor.count", async () => {
        const indexed = localIndexed("database")
        const store = indexed.collection<Store>("store")
        expect(await indexed.upgrade(() => {
            expect(store.create({ keyPath: "id", autoIncrement: true })).toBe(true)
        })).toBe(undefined)
        expect(await store.insert([
            { name: "name1", type: "type1" },
            { name: "name2", type: "type2" },
            { name: "name3", type: "type1" },
            { name: "name4", type: "type2" },
            { name: "name5", type: "type1" }
        ])).toEqual([1, 2, 3, 4, 5])
        expect(await store.find(() => true).count()).toBe(5)
        expect(await store.find(item => item.id === 1).count()).toBe(1)
        expect(await store.find(item => item.id < 5).count()).toBe(4)
    })
})