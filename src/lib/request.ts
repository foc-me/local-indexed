/**
 * A object with result but is not Event
 */
export type IDBRequestLike<T = any> = {
    /**
     * result
     */
    result: T
}

/**
 * get objectStore or index request result
 * 
 * if the return value is IDBRequest resolve its result in success event callback
 * 
 * otherwise resolve the result directly
 * 
 * @param callback request action
 * @returns request result
 */
export function requestAction<T = any>(callback: () => IDBRequest | IDBRequestLike | void) {
    return new Promise<T>(async (resolve, reject) => {
        try {
            const request = callback()
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