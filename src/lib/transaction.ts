import { type IDBRequestActionResult } from "./request"

type IDBTransactionActionOptions = {
    abort?: boolean
    durability?: IDBTransactionDurability
}

/**
 * transaction action
 * 
 * auto close database connection after action finished
 * 
 * result value depends on the return value of action
 * 
 * rollback defaults to true
 * 
 * means transaction will rollback after got errors
 * 
 * otherwise the transaction will keep the existing data
 * 
 * @param transaction transaction
 * @param action transaction action
 * @param rollback rollback type
 * @returns request result
 */
export function transactionAction<T = any>(
    transaction: IDBTransaction,
    action: () => IDBRequestActionResult | Promise<IDBRequestActionResult>,
    rollback: boolean = true
) {
    const abort = () => {
        if (rollback === true) {
            transaction.abort()
        }
    }
    return new Promise<T>(async (resolve, reject) => {
        try {
            const call = action()
            const request = call instanceof Promise ? await call : call
            transaction.addEventListener("complete", () => {
                resolve((request ? request.result : undefined) as T)
                transaction.db.close()
            })
            transaction.addEventListener("error", (error) => {
                abort()
                transaction.db.close()
                reject(error)
            })
        } catch (error) {
            abort()
            transaction.db.close()
            reject(error)
        }
    })
}