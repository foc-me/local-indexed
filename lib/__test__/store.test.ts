import "fake-indexeddb/auto"
import { getDatabase, getDatabaseStoreNames, getDatabaseVersion } from "../database"
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
            expect(await getDatabaseVersion(databaseName)).toBe(i)
        }
    })
    it("check stores", async () => {
        expect(await getDatabaseVersion(databaseName)).toBe(last)
        const stores = await getDatabaseStoreNames(databaseName)
        expect(stores.length).toBe(10)
        for (let i = 1; i <= last; i++) {
            const name = `object-store-${i}`
            expect(stores.includes(name))
        }
    })
    it("set store item", async () => {
        const storeName = "object-store-10"
        const storeValue = { id: 1, name: "Mike Joe", age: 21 }
        const [database, close] = await getDatabase(databaseName)
        await setStoreItem(database, storeName, storeValue)
        const returnValue = await getStoreItem<TestStoreType>(database, storeName, 1)
        close()

        if (returnValue) {
            expect(returnValue.id).toBe(storeValue.id)
            expect(returnValue.name).toBe(storeValue.name)
            expect(returnValue.age).toBe(storeValue.age)
        } else throw new Error("return value should not be null")
    })
})