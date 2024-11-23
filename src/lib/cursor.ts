/**
 * IBDCursor action
 * 
 * take cursor.continue() in action to get next cursor until to the last one
 * 
 * any thing except undefined and null that returned by action callback
 * will stop the cursor and resolve the result immediately
 * 
 * @param request open cursor request
 * @param callback action callback
 * @returns void or the result returned by the action callback
 */
export function cursorAction<T = void>(
    request: IDBRequest<IDBCursorWithValue | null>,
    callback: (cursor: IDBCursorWithValue) => (T | void) | Promise<T | void>
) {
    return new Promise<T>((resolve, reject) => {
        request.addEventListener("success", async () => {
            if (request.result) {
                try {
                    const call = callback(request.result)
                    const result = call instanceof Promise ? await call : call
                    if (result !== undefined && result !== null) {
                        resolve(result)
                    }
                } catch (error) {
                    reject(error)
                }
            } else {
                resolve(undefined as T)
            }
        })
        request.addEventListener("error", (error) => {
            reject(error)
        })
    })
}