import { type IDBRequestActionResult } from "./request"

/**
 * transaction action
 * 
 * auto close database connection after action finished
 * 
 * result value depends on the return value of action
 * 
 * @param transaction transaction
 * @param action transaction action
 * @returns request result
 */
export function transactionAction<T = any>(
    transaction: IDBTransaction,
    action: () => IDBRequestActionResult | Promise<IDBRequestActionResult>
) {
    return new Promise<T>(async (resolve, reject) => {
        try {
            const call = action()
            const request = call instanceof Promise ? await call : call
            transaction.addEventListener("complete", () => {
                resolve((request ? request.result : undefined) as T)
                transaction.db.close()
            })
            transaction.addEventListener("error", (error) => {
                transaction.abort()
                transaction.db.close()
                reject(error)
            })
        } catch (error) {
            transaction.abort()
            transaction.db.close()
            reject(error)
        }
    })
}