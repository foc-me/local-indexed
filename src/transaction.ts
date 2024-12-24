import { transactionAction } from "./lib/transaction"
import { type LDBContext } from "./context"

/**
 * indexed transaction
 * 
 * @param context database context
 * @param callback transaction callback
 */
export async function transaction(context: LDBContext, callback?: () => void) {
    const database = await context.makeDatabase()
    const stores = [...database.objectStoreNames]

    // an error will be thrown when creating transaction with no object stores in database
    if (stores.length < 1) {
        database.close()
        return
    }

    const transaction = database.transaction(stores, "readwrite")
    context.setTransaction(transaction)
    await transactionAction(transaction, () => {
        if (typeof callback === "function") {
            return callback()
        }
    }).finally(() => {
        context.setTransaction()
    })
}