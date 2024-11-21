export function cursorAction<T = void>(
    request: IDBRequest<IDBCursorWithValue | null>,
    action: (cursor: IDBCursorWithValue) => (T | void) | Promise<T | void>
) {
    return new Promise<T>((resolve, reject) => {
        request.addEventListener("success", async () => {
            if (request.result) {
                try {
                    const call = action(request.result)
                    const target = call instanceof Promise ? await call : call
                    if (target !== undefined && target !== null) {
                        resolve(target)
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