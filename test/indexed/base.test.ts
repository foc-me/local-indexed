import "fake-indexeddb/auto"
import localIndexed from "../../src/indexed"

const databaseName = "local-indexed"
const storeName = "test-store"

describe("check indexed apis", () => {
    it("check error", async () => {
        const indexed = localIndexed(databaseName)
        expect(() => indexed.abort()).toThrow("localIndexed.abort requires transaction or upgrade")
    })
    it("check create", async () => {
        const indexed = localIndexed(databaseName)
        await indexed.upgrade(() => {
            for (let i = 0; i < 10; i++) {
                const store = indexed.collection(`${storeName}-${i}`)
                store.create({
                    keyPath: "id",
                    autoIncrement: true,
                    indexes: {
                        odd: { unique: false },
                        re10: { unique: false },
                        value: { unique: true }
                    }
                })
            }
        })
        expect(await indexed.version()).toBe(1)
    })
    it("check stores", async () => {
        const indexed = localIndexed(databaseName)
        const stores = new Array(10).fill(undefined).map((item, index) => {
            return `${storeName}-${index}`
        })
        expect(await indexed.stores()).toEqual(stores)
    })
    it("check close", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection(storeName)
        await indexed.upgrade(() => {
            expect(indexed.close()).toBe(undefined)
            expect(() => store.create()).toThrow("collection.create requires upgrade")
        })
    })
})