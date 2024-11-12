export function cursorAction<T extends object>(
    request: IDBRequest<IDBCursorWithValue | null>,
    action: (current: T, stop: () => void) => boolean | void
) {
    return new Promise<T[]>((resolve, reject) => {
        const result: T[] = []
        const stop = { current: false }
        const setStop = () => { stop.current = true }
        request.addEventListener("success", () => {
            const cursor = request.result
            if (cursor) {
                if (action(cursor.value, setStop) === true) {
                    result.push(cursor.value)
                }
                if (stop.current === false) cursor.continue()
                else resolve(result)
            } else {
                resolve(result)
            }
        })
        request.addEventListener("error", (error) => {
            reject(error)
        })
    })
}