import { type IDBRequestLike } from "./request"

/**
 * returns the transaction request result and close the database connect
 * 
 * @param transaction transaction
 * @param action transaction action
 * @returns request result
 */
export function transactionAction<T = any>(
    transaction: IDBTransaction,
    action: () => IDBRequest | IDBRequestLike | void
) {
    return new Promise<T>(async (resolve, reject) => {
        try {
            const request = action()
            transaction.addEventListener("complete", () => {
                resolve((request ? request.result : undefined) as T)
                transaction.db.close()
            })
            transaction.addEventListener("abort", () => {
                transaction.db.close()
                reject(new Error("transaction abort"))
            })
            transaction.addEventListener("error", (error) => {
                transaction.db.close()
                reject(error)
            })
        } catch (error) {
            transaction.db.close()
        }
    })
}