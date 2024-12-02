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
    const database = await context.makeDatabase()
    const stores = [...database.objectStoreNames]
    const transaction = database.transaction(stores, "readwrite")
    context.setTransaction(transaction)
    await transactionAction(transaction, () => {
        return callback()
    }).finally(() => {
        context.setTransaction()
    })
}