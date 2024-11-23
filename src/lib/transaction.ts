import { type IDBActionRequest } from "./request"

/**
 * IBDTransaction action
 * 
 * the action callback could return a IDBRequest or something like it (object with result attribute) if needed
 * 
 * action option defaults to { autoClose: true, abort: true }
 * 
 * by default the action will rollback if some error throwed while action excution
 * and close the database connection after action finished
 * 
 * -- set autoClose true to auto close database connection after action finished
 * 
 * -- set abort true to abort transaction after throw error while excuting transaction
 * 
 * @param transaction transaction
 * @param callback action callback
 * @param option action option
 * @returns request result
 */
export function transactionAction<T = any>(
    transaction: IDBTransaction,
    callback: () => IDBActionRequest | Promise<IDBActionRequest>,
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
            const call = callback()
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