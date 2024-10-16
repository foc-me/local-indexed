import "fake-indexeddb/auto"
import { getDatabase, getStoreNames, getVersion } from "../database"
import { upgradeDatabase, type IDBStoreOption } from "../upgrade"
import { getStoreItem, setStoreItem, deleteStoreItem } from "../store"

type TestStoreType = {
    id: number
    name: string
    age: number
}

const last = 10
const databaseName = "local-indexed"
const storeOption: IDBStoreOption = {
    keyPath: "id",
    autoIncrement: false,
    index: {
        name: { unique: false }
    }
}

describe("database store", () => {
    it("create a database", async () => {
        for (let i = 1; i <= last; i++) {
            await upgradeDatabase(databaseName, i, (context) => {
                context.createStore(`object-store-${i}`, storeOption)
            })
            expect(await getVersion(databaseName)).toBe(i)
        }
    })
    it("check stores", async () => {
        expect(await getVersion(databaseName)).toBe(last)
        const stores = await getStoreNames(databaseName)
        expect(stores.length).toBe(10)
        for (let i = 1; i <= last; i++) {
            const name = `object-store-${i}`
            expect(stores.includes(name))
        }
    })
    it("set store item", async () => {
        const storeName = "object-store-10"
        const storeValue = { id: 1, name: "Mike Joe", age: 21 }
        await setStoreItem(databaseName, storeName, storeValue)
        const returnValue = await getStoreItem<TestStoreType>(databaseName, storeName, 1)

        if (returnValue) {
            expect(returnValue.id).toBe(storeValue.id)
            expect(returnValue.name).toBe(storeValue.name)
            expect(returnValue.age).toBe(storeValue.age)
        } else throw new Error("return value should not be null")
    })
    it("update store item", async () => {
        const storeName = "object-store-10"
        const storeValue = { id: 1, name: "Jessica Joe", age: 22 }
        await setStoreItem(databaseName, storeName, storeValue)
        const result1 = await getStoreItem<TestStoreType>(databaseName, storeName, 1)
        if (result1) {
            expect(result1.id).toBe(1)
            expect(result1.name).toBe("Jessica Joe")
            expect(result1.age).toBe(22)
        }
        Object.assign(storeValue, { id: 3 })
        const result3 = await getStoreItem<TestStoreType>(databaseName, storeName, 3)
        if (result3) {
            expect(result3.id).toBe(3)
            expect(result3.name).toBe("Jessica Joe")
            expect(result3.age).toBe(22)
        }
    })
    it("delete store item", async () => {
        const storeName = "object-store-10"
        await deleteStoreItem(databaseName, storeName, 1)
        await deleteStoreItem(databaseName, storeName, 3)
        const result1 = await getStoreItem<TestStoreType>(databaseName, storeName, 1)
        const result3 = await getStoreItem<TestStoreType>(databaseName, storeName, 3)
        expect(result1).toBe(undefined)
        expect(result3).toBe(undefined)
    })
})