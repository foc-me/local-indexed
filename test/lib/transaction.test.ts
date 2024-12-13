import "fake-indexeddb/auto"
import { getDatabases, deleteDatabase } from "../../src/lib/indexed"
import { getDatabase } from "../../src/lib/database"
import { upgradeAction } from "../../src/lib/upgrade"
import { transactionAction } from "../../src/lib/transaction"
import { requestAction } from "../../src/lib/request"

type Store = { id: number, value: number, odd?: "odd", re10: number }

const databaseName = "local-indexed"
const storeName = "test-store"

describe("check transaction action", () => {
    it("check empty indexed", async () => {
        expect((await getDatabases()).length).toBe(0)
    })
    it("check create", async () => {
        await upgradeAction(databaseName, 1, async (event) => {
            const { transaction } = event
            const objectStore = transaction.db.createObjectStore(storeName, {
                keyPath: "id",
                autoIncrement: true
            })
            objectStore.createIndex("odd", "odd", { unique: false })
            objectStore.createIndex("re10", "re10", { unique: false })
        })
        expect((await getDatabases()).length).toBe(1)
    })
    it("check add", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readwrite")
        await transactionAction(transaction, async () => {
            for (let i = 1; i <= 50; i++) {
                const odd = i % 2 === 0 ? { odd: "odd" } : {}
                const id = await requestAction(() => {
                    const objectStore = transaction.objectStore(storeName)
                    return objectStore.add(Object.assign({ value: i, re10: i % 10 }, odd))
                })
                expect(id).toBe(i)
            }
        })
    })
    it("check put", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readwrite")
        await transactionAction(transaction, async () => {
            for (let i = 1; i <= 100; i++) {
                const id = i <= 50 ? { id: i } : {}
                const odd = i % 2 === 0 ? { odd: "odd" } : {}
                expect(await requestAction(() => {
                    const objectStore = transaction.objectStore(storeName)
                    return objectStore.put(Object.assign({ value: i, re10: i % 10 }, id, odd))
                })).toBe(i)
            }
        })
    })
    it("check request error", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readwrite")
        await expect(transactionAction(transaction, () => {
            return requestAction(() => {
                return transaction.objectStore(storeName).add({ id: 1, value: 1 })
            })
        })).rejects.toThrow("A mutation operation in the transaction failed because a constraint was not satisfied. For example, an object such as an object store or index already exists and a request attempted to create a new one.")
    })
    it("check abort error", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readwrite")
        await expect(transactionAction(transaction, () => {
            transaction.abort()
        })).resolves.toBe(undefined)
        // transaction finished
        await expect(transactionAction(transaction, () => {
            transaction.abort()
        })).rejects.toThrow("An operation was called on an object on which it is not allowed or at a time when it is not allowed. Also occurs if a request is made on a source object that has been deleted or removed. Use TransactionInactiveError or ReadOnlyError when possible, as they are more specific variations of InvalidStateError.")
    })
    it("check abort", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readwrite")
        await transactionAction(transaction, async () => {
            expect(await requestAction(() => {
                return transaction.objectStore(storeName).delete(IDBKeyRange.bound(1, 50))
            })).toBe(undefined)
            const values = await requestAction(() => {
                return transaction.objectStore(storeName).getAll()
            })
            expect(values.length).toBe(50)
            transaction.abort()
        })
    })
    it("check count", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readonly")
        await transactionAction(transaction, async () => {
            expect(await requestAction(() => {
                return transaction.objectStore(storeName).count()
            })).toBe(100)
            expect(await requestAction(() => {
                return transaction.objectStore(storeName).count(1)
            })).toBe(1)
            for (let i = 0; i < 10; i++) {
                const start = i * 10 + 1
                const range = IDBKeyRange.bound(start, start + 9)
                expect(await requestAction(() => {
                    return transaction.objectStore(storeName).count(range)
                })).toBe(10)
            }
        })
    })
    it("check get", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readonly")
        await transactionAction(transaction, async () => {
            for (let i = 0; i < 100; i++) {
                const id = i + 1
                const item = await requestAction<Store>(() => {
                    return transaction.objectStore(storeName).get(id)
                })
                const odd = i % 2 === 1 ? "odd" : undefined
                const re10 = (i % 10) + 1
                expect(item.id).toBe(id)
                expect(item.value).toBe(id)
                expect(item.odd).toBe(odd)
                expect(item.re10).toBe(re10 === 10 ? 0 : re10)
            }
            for (let i = 0; i < 10; i++) {
                const start = i * 10 + 1
                const range = IDBKeyRange.bound(start, start + 9)
                const item = await requestAction<Store>(() => {
                    return transaction.objectStore(storeName).get(range)
                })
                expect(item.id).toBe(start)
                expect(item.value).toBe(start)
                expect(item.odd).toBe(undefined)
                expect(item.re10).toBe(1)
            }
        })
    })
    it("check getAll", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readonly")
        await transactionAction(transaction, async () => {
            const results = await requestAction(() => {
                return transaction.objectStore(storeName).getAll()
            })
            expect(results.length).toBe(100)
            for (let i = 0; i < results.length; i++) {
                const item = results[i]
                const value = i + 1
                const odd = i % 2 === 1 ? "odd" : undefined
                const re10 = (i % 10) + 1
                expect(item.id).toBe(value)
                expect(item.value).toBe(value)
                expect(item.odd).toBe(odd)
                expect(item.re10).toBe(re10 === 10 ? 0 : re10)
            }
            for (let i = 0; i < 10; i++) {
                const start = i * 10 + 1
                const range = IDBKeyRange.bound(start, start + 9)
                const items = await requestAction<Store[]>(() => {
                    return transaction.objectStore(storeName).getAll(range)
                })
                expect(items.length).toBe(10)
                for (let j = start; j < items.length; j++) {
                    const item = items[j]
                    const value = j + 1
                    const odd = j % 2 === 1 ? "odd" : undefined
                    const re10 = (j % 10) + 1
                    expect(item.id).toBe(value)
                    expect(item.value).toBe(value)
                    expect(item.odd).toBe(odd)
                    expect(item.re10).toBe(re10 === 10 ? 0 : re10)
                }
            }
        })
    })
    it("check getAllKeys", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readonly")
        await transactionAction(transaction, async () => {
            const results = await requestAction<number[]>(() => {
                return transaction.objectStore(storeName).getAllKeys()
            })
            expect(results.length).toBe(100)
            results.forEach((item, index) => {
                expect(item).toBe(index + 1)
            })
            for (let i = 0; i < 10; i++) {
                const start = i * 10 + 1
                const range = IDBKeyRange.bound(start, start + 9)
                const keys = await requestAction<number[]>(() => {
                    return transaction.objectStore(storeName).getAllKeys(range)
                })
                expect(keys.length).toBe(10)
                keys.forEach((item, index) => {
                    expect(item).toBe(i * 10 + index + 1)
                })
            }
        })
    })
    it("check getKey", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readonly")
        await transactionAction(transaction, async () => {
            for (let i = 0; i < 10; i++) {
                const start = i * 10 + 1
                const range = IDBKeyRange.bound(start, start + 9)
                expect(await requestAction(() => {
                    return transaction.objectStore(storeName).getKey(range)
                })).toBe(start)
            }
        })
    })
    it("check index count", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readonly")
        await transactionAction(transaction, async () => {
            const objectStore = transaction.objectStore(storeName)
            const odd = objectStore.index("odd")
            expect(await requestAction(() => {
                return odd.count()
            })).toBe(50)
            const re10 = objectStore.index("re10")
            expect(await requestAction(() => {
                return re10.count()
            })).toBe(100)
            for (let i = 0; i < 10; i++) {
                expect(await requestAction(() => {
                    return re10.count(i)
                })).toBe(10)
                const range = IDBKeyRange.bound(0, i)
                expect(await requestAction(() => {
                    return re10.count(range)
                })).toBe((i + 1) * 10)
            }
        })
    })
    it("check index get", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readonly")
        await transactionAction(transaction, async () => {
            const objectStore = transaction.objectStore(storeName)
            const odd = objectStore.index("odd")
            const oddItem = await requestAction<Store>(() => {
                return odd.get("odd")
            })
            expect(oddItem.id).toBe(2)
            expect(oddItem.value).toBe(2)
            expect(oddItem.odd).toBe("odd")
            expect(oddItem.re10).toBe(2)

            const re10 = objectStore.index("re10")
            for (let i = 0; i < 10; i++) {
                const range = IDBKeyRange.bound(i, 9)
                const reItem = await requestAction<Store>(() => {
                    return re10.get(range)
                })
                const value = i === 0 ? 10 : i
                const odd = i === 0 ? "odd" : (i % 2 === 1 ? undefined : "odd")
                expect(reItem.id).toBe(value)
                expect(reItem.value).toBe(value)
                expect(reItem.odd).toBe(odd)
                expect(reItem.re10).toBe(i)
            }
        })
    })
    it("check index getAll", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readonly")
        await transactionAction(transaction, async () => {
            const objectStore = transaction.objectStore(storeName)
            const odd = objectStore.index("odd")
            const oddItems = await requestAction<Store[]>(() => {
                return odd.getAll()
            })
            expect(oddItems.length).toBe(50)
            for (let i = 0; i < oddItems.length; i++) {
                const item = oddItems[i]
                const re10 = (i % 5) * 2 + 2
                const value = Math.floor(i / 5) * 10 + re10
                expect(item.id).toBe(value)
                expect(item.value).toBe(value)
                expect(item.odd).toBe("odd")
                expect(item.re10).toBe(re10 === 10 ? 0 : re10)
            }

            const re10 = objectStore.index("re10")
            const reItems = await requestAction<Store[]>(() => {
                return re10.getAll()
            })
            expect(reItems.length).toBe(100)
            for (let i = 0; i < reItems.length; i++) {
                const item = reItems[i]
                const re10 = Math.floor(i / 10)
                const value = i < 10 ? (i + 1) * 10 : (i % 10) * 10 + re10
                expect(item.id).toBe(value)
                expect(item.value).toBe(value)
                expect(item.odd).toBe(re10 % 2 === 1 ? undefined : "odd")
                expect(item.re10).toBe(re10)
            }
            for (let i = 0; i < 10; i++) {
                const items = await requestAction<Store[]>(() => {
                    return re10.getAll(i)
                })
                expect(items.length).toBe(10)
                for (let j = 0; j < items.length; j++) {
                    const item = items[j]
                    const value = i === 0 ? (j + 1) * 10 : j * 10 + i
                    expect(item.id).toBe(value)
                    expect(item.value).toBe(value)
                    expect(item.odd).toBe(i % 2 === 1 ? undefined : "odd")
                    expect(item.re10).toBe(i)
                }
            }
        })
    })
    it("check index getAllKeys", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readonly")
        await transactionAction(transaction, async () => {
            const objectStore = transaction.objectStore(storeName)
            const odd = objectStore.index("odd")
            const oddKeys = await requestAction<number[]>(() => {
                return odd.getAllKeys()
            })
            expect(oddKeys.length).toBe(50)
            oddKeys.forEach((item, index) => {
                expect(item).toBe((index + 1) * 2)
            })

            const re10 = objectStore.index("re10")
            const reKeys = await requestAction<number[]>(() => {
                return re10.getAllKeys()
            })
            expect(reKeys.length).toBe(100)
            reKeys.forEach((item, index) => {
                expect(item).toBe(index < 10 ? (index + 1) * 10 : index % 10 * 10 + Math.floor(index / 10))
            })
            for (let i = 0; i < 10; i++) {
                const items = await requestAction<number[]>(() => {
                    return re10.getAllKeys(i)
                })
                expect(items.length).toBe(10)
                items.forEach((item, index) => {
                    expect(item).toBe(i === 0 ? (index + 1) * 10 : index * 10 + i)
                })
            }
        })
    })
    it("check index getKey", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readonly")
        await transactionAction(transaction, async () => {
            const objectStore = transaction.objectStore(storeName)
            const odd = objectStore.index("odd")
            expect(await requestAction<number[]>(() => {
                return odd.getKey("odd")
            })).toBe(2)

            const re10 = objectStore.index("re10")
            for (let i = 0; i < 10; i++) {
                expect(await requestAction(() => {
                    return re10.getKey(i)
                })).toBe(i === 0 ? 10 : i)
            }
        })
    })
    it("check delete", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readwrite")
        await transactionAction(transaction, async () => {
            const objectStore = transaction.objectStore(storeName)
            for (let i = 0; i < 20; i++) {
                expect(await requestAction<number[]>(() => {
                    return objectStore.delete(i + 1)
                })).toBe(undefined)
            }
            expect(await requestAction(() => {
                return objectStore.count()
            })).toBe(80)
            for (let i = 0; i < 3; i++) {
                const start = (i + 2) * 10 + 1
                const range = IDBKeyRange.bound(start, start + 9)
                expect(await requestAction<number[]>(() => {
                    return objectStore.delete(range)
                })).toBe(undefined)
            }
            expect(await requestAction(() => {
                return objectStore.count()
            })).toBe(50)
        })
    })
    it("check clear", async () => {
        const database = await getDatabase(databaseName)
        const transaction = database.transaction(storeName, "readwrite")
        await transactionAction(transaction, async () => {
            const objectStore = transaction.objectStore(storeName)
            expect(await requestAction<number[]>(() => {
                return objectStore.clear()
            })).toBe(undefined)
            expect(await requestAction(() => {
                return objectStore.count()
            })).toBe(0)
        })
    })
    it("check delete database", async () => {
        await deleteDatabase(databaseName)
        expect((await getDatabases()).length).toBe(0)
    })
})