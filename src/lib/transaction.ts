import { type IDBRequestActionResult } from "./request"

/**
 * transaction action
 * 
 * result value depends on the return value of action
 * 
 * action option defaults to { autoClose: true, abort: true }
 * 
 * set autoClose true to auto close database connection after action finished
 * 
 * set abort true to abort transaction after throw error while excuting transaction
 * 
 * means transaction will rollback after got errors
 * 
 * otherwise the transaction will keep the existing data
 * 
 * @param transaction transaction
 * @param action transaction action
 * @param option transaction action option
 * @returns request result
 */
export function transactionAction<T = any>(
    transaction: IDBTransaction,
    action: () => IDBRequestActionResult | Promise<IDBRequestActionResult>,
    option?: { autoClose?: boolean, rollback?: boolean }
) {
    const { autoClose = true, rollback = true } = option || {}
    const close = () => {
        if (autoClose === true) {
            transaction.db.close()
        }
    }
    const abortAndClose = () => {
        if (rollback === true) {
            transaction.abort()
        }
        close()
    }
    return new Promise<T>(async (resolve, reject) => {
        try {
            const call = action()
            const request = call instanceof Promise ? await call : call
            transaction.addEventListener("complete", () => {
                resolve((request ? request.result : undefined) as T)
                close()
            })
            transaction.addEventListener("error", (error) => {
                abortAndClose()
                reject(error)
            })
        } catch (error) {
            abortAndClose()
            reject(error)
        }
    })
}