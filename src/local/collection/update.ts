import { cursorAction } from "../../lib/cursor"
import { type IDBActionRequest, requestAction } from "../../lib/request"

/**
 * update value
 * 
 * @param objectStore object store
 * @param value value
 * @returns request
 */
export function updateOne(objectStore: IDBObjectStore, value: any) {
    return objectStore.put(value)
}

/**
 * update value with cursor
 * 
 * @param objectStore object store
 * @param filter cursor filter
 * @param option cursor option
 * @returns affected ids
 */
export async function updateOneCursor<T extends object, K extends IDBValidKey>(
    objectStore: IDBObjectStore | IDBIndex,
    filter: (item: T) => any,
    option?: {
        query?: IDBValidKey | IDBKeyRange,
        direction?: IDBCursorDirection
    }
) {
    const { query, direction } = option || {}
    const request = objectStore.openCursor(query, direction)
    const result = await cursorAction<K | undefined>(request, async (cursor) => {
        const target = filter(cursor.value)
        if (target !== undefined && target !== null) {
            return await requestAction<K>(() => {
                return cursor.update(target)
            })
        }
        cursor.continue()
    })
    return { result } as IDBActionRequest<K>
}

/**
 * update values
 * 
 * @param objectStore object store
 * @param values values
 * @returns affected ids
 */
export async function updateMany<K extends IDBValidKey>(objectStore: IDBObjectStore, values: any[]) {
    const result: K[] = []
    for (let i = 0; i < values.length; i++) {
        result.push(await requestAction(() => {
            return objectStore.put(values[i])
        }))
    }
    return { result } as IDBActionRequest<K[]>
}

/**
 * update values with cursor
 * 
 * @param objectStore object store
 * @param filter cursor filter
 * @param option cursor option
 * @returns affected ids
 */
export async function updateManyCursor<T extends object, K extends IDBValidKey>(
    objectStore: IDBObjectStore | IDBIndex,
    filter: (item: T) => any,
    option?: {
        query?: IDBValidKey | IDBKeyRange,
        direction?: IDBCursorDirection
    }
) {
    const { query, direction } = option || {}
    const request = objectStore.openCursor(query, direction)
    const result: K[] = []
    await cursorAction(request, async (cursor) => {
        const target = filter(cursor.value)
        if (target !== undefined && target !== null) {
            result.push(await requestAction(() => {
                return cursor.update(target)
            }))
        }
        cursor.continue()
    })
    return { result } as IDBActionRequest<K[]>
}