import { getDatabase } from "../lib/database"
import { transactionAction } from "../lib/transaction"
import { type LDBCollection, collection } from "./collection"
import { type LDBContext, makeContext } from "./context"

/**
 * transaction context
 */
export interface LDBTransactionContext {
    collection<T extends object>(store: string): LDBCollection<T>
    abort(): void
}

/**
 * make transaction context
 * 
 * @param transaction transaction
 * @param context database context
 * @returns transaction context
 */
function makeTransactionContext(transaction: IDBTransaction, context: LDBContext) {
    const { database, indexedDB } = context
    const collectionContext = makeContext(database, indexedDB, transaction)
    return {
        collection: <T extends object>(store: string) => {
            return collection<T>(store, collectionContext)
        },
        abort: () => { transaction.abort() }
    } as LDBTransactionContext
}

/**
 * indexed transaction
 * 
 * @param callback transaction callback
 * @param context database context
 */
export async function transaction(
    callback: (context: LDBTransactionContext) => void,
    context: LDBContext
) {
    const { database } = context
    const db = await getDatabase(database)
    const stores = [...db.objectStoreNames]
    const transaction = db.transaction(stores, "readwrite")
    await transactionAction(transaction, () => {
        return callback(makeTransactionContext(transaction, context))
    })
}