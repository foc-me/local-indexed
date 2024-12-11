import { cursorAction } from "../../lib/cursor"
import { type IDBActionRequest } from "../../lib/request"

/**
 * get values count
 * 
 * @param objectStore object store
 * @param filter values filter
 * @returns request
 */
export async function countMany(
    objectStore: IDBObjectStore | IDBIndex,
    filter?: IDBValidKey | IDBKeyRange
) {
    return objectStore.count(filter) as IDBRequest<number>
}

/**
 * get values count with cursor
 * 
 * @param objectStore object store
 * @param filter sursor filter
 * @param option sursor option
 * @returns count number
 */
export async function countManyCursor<T>(
    objectStore: IDBObjectStore | IDBIndex,
    filter: (item: T) => boolean,
    option?: {
        query?: IDBValidKey | IDBKeyRange,
        direction?: IDBCursorDirection
    }
) {
    const { query, direction } = option || {}
    const request = objectStore.openCursor(query, direction)
    const result = { result: 0 }
    await cursorAction(request, (cursor) => {
        if (filter(cursor.value) === true) {
            result.result++
        }
        cursor.continue()
    })
    return result as IDBActionRequest<number>
}