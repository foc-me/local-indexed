/**
 * A object with result but is not Event
 */
export type IDBRequestLike<T = any> = {
    /**
     * result
     */
    result: T
}

export type IDBRequestActionResult = IDBRequest | IDBRequestLike | void

/**
 * objectStore or index request result
 * 
 * if the return value is IDBRequest resolve its result in success event callback
 * 
 * otherwise resolve the result directly
 * 
 * @param action request action
 * @returns request result
 */
export function requestAction<T = any>(
    action: () => IDBRequestActionResult | Promise<IDBRequestActionResult>
) {
    return new Promise<T>(async (resolve, reject) => {
        try {
            const call = action()
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