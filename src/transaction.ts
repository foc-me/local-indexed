import { transactionAction } from "./lib/transaction"
import { type LDBContext } from "./context"

/**
 * indexed transaction
 * 
 * @param context database context
 * @param callback transaction callback
 */
export async function transaction(context: LDBContext, callback: () => void) {
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