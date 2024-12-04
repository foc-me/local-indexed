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
    const { autoClose = true } = option || {}
    const close = () => {
        if (autoClose) {
            transaction.db.close()
        }
    }
    return new Promise<T>(async (resolve, reject) => {
        try {
            const call = callback()
            const request = call instanceof Promise ? await call : call
            transaction.addEventListener("complete", () => {
                close()
                resolve((request ? request.result : undefined) as T)
            })
            transaction.addEventListener("abort", () => {
                close()
                if (transaction.error) {
                    reject(new Error(transaction.error.message))
                } else resolve((request ? request.result : undefined) as T)
            })
        } catch (error) {
            close()
            reject(error)
        }
    })
}