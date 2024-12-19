import "fake-indexeddb/auto"
import localIndexed from "../../src/indexed"

const databaseName = "local-indexed"
const storeName = "test-store"

describe("check indexed upgrade collection", () => {
    it("check error", async () => {
        const indexed = localIndexed(databaseName)
        const store = indexed.collection(storeName)
        expect(await indexed.upgrade(async () => {
            expect(() => store.createIndex("odd")).toThrow("objectStore 'test-store' does not exist")
            expect(() => store.dropIndex("odd")).toThrow("objectStore 'test-store' does not exist")
        })).toBe(undefined)
        expect(await indexed.upgrade(async () => {
            expect(store.create()).toBe(true)
        })).toBe(undefined)
        expect(await indexed.upgrade(async () => {
            expect(() => store.create()).toThrow("objectStore 'test-store' already exists")
        })).toBe(undefined)
    })
})