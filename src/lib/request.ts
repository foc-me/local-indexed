/**
 * request action callback result
 */
export type IDBActionRequest<T = any> = IDBRequest<T> | { result: T } | void

/**
 * IDBRequest action
 * 
 * the action callback could return a IDBRequest or something like it (object with result attribute) if needed
 * 
 * @param callback action callback
 * @returns void or the result return by action callback
 */
export function requestAction<T = any>(
    callback: () => IDBActionRequest | Promise<IDBActionRequest>
) {
    return new Promise<T>(async (resolve, reject) => {
        try {
            const call = callback()
            const request = call instanceof Promise ? await call : call
            if (request instanceof IDBRequest) {
                request.addEventListener("success", () => {
                    resolve(request.result as T)
                })
                request.addEventListener("error", (error) => {
                    reject(error)
                })
            } else {
                resolve((request ? request.result : undefined) as T)
            }
        } catch (error) {
            reject(error)
        }
    })
}