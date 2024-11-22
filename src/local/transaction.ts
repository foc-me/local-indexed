import { getDatabase } from "../lib/database"
import { transactionAction } from "../lib/transaction"
import { makeContext, type LDBContext } from "./context"
import { collection, type LDBCollection } from "./collection"

export interface LDBTransactionContext {
    collection<T extends object>(store: string): LDBCollection<T>
}

function makeTransactionContext(transaction: IDBTransaction, context: LDBContext) {
    const { database, indexedDB } = context
    const collectionContext = makeContext(database, indexedDB, transaction)
    return {
        collection: <T extends object>(store: string) => {
            return collection<T>(store, collectionContext)
        }
    } as LDBTransactionContext
}

export async function transaction(
    action: (context: LDBTransactionContext) => void,
    context: LDBContext
) {
    const { database } = context
    const db = await getDatabase(database)
    const stores = [...db.objectStoreNames]
    const transaction = db.transaction(stores, "readwrite")
    await transactionAction(transaction, () => {
        return action(makeTransactionContext(transaction, context))
    })
}