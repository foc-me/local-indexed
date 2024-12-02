import { getDatabase } from "../lib/database"
import { transactionAction } from "../lib/transaction"
import { type LDBContext } from "./context"

/**
 * indexed transaction
 * 
 * @param callback transaction callback
 * @param context database context
 */
export async function transaction(
    callback: () => void,
    context: LDBContext
) {
    const { database } = context
    const db = await getDatabase(database)
    const stores = [...db.objectStoreNames]
    const transaction = db.transaction(stores, "readwrite")
    await transactionAction(transaction, () => {
        context.transaction = transaction
        return callback()
    }).finally(() => {
        context.transaction = undefined
    })
}