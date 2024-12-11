import { cursorAction } from "../../lib/cursor"
import { type IDBActionRequest, requestAction } from "../../lib/request"

/**
 * delete value
 * 
 * @param objectStore object store
 * @param value key value
 * @returns rows affected number
 */
export async function removeOne(objectStore: IDBObjectStore, value: IDBValidKey) {
    await requestAction(() => {
        return objectStore.delete(value)
    })
    const result = await requestAction(() => {
        return objectStore.get(value)
    })
    return { result: result ? 0 : 1 } as IDBActionRequest<number>
}

/**
 * delete value with cursor
 * 
 * @param objectStore object store
 * @param filter cursor filter
 * @param option cursor option
 * @returns rows affected number
 */
export async function removeOneCursor<T extends object>(
    objectStore: IDBObjectStore | IDBIndex,
    filter: (item: T) => boolean,
    option?: {
        query?: IDBValidKey | IDBKeyRange,
        direction?: IDBCursorDirection
    }
) {
    const { query, direction } = option || {}
    const request = objectStore.openCursor(query, direction)
    const result: any[] = []
    await cursorAction(request, async (cursor) => {
        if (filter(cursor.value) === true) {
            result.push(await requestAction(() => {
                return cursor.delete()
            }))
            return true
        }
        cursor.continue()
    })
    return { result: result.length } as IDBActionRequest<number>
}

/**
 * delete values
 * 
 * @param objectStore object store
 * @param range key range
 * @returns request
 */
export async function removeManyKeyRange(objectStore: IDBObjectStore, range: IDBKeyRange) {
    return objectStore.delete(range)
}

/**
 * delete values with cursor
 * 
 * @param objectStore object store
 * @param filter cursor filter
 * @param option cursor option
 * @returns rows affected number
 */
export async function removeManyCursor<T extends object>(
    objectStore: IDBObjectStore | IDBIndex,
    filter: (item: T) => boolean,
    option?: {
        query?: IDBValidKey | IDBKeyRange,
        direction?: IDBCursorDirection
    }
) {
    const { query, direction } = option || {}
    const request = objectStore.openCursor(query, direction)
    const result: any[] = []
    await cursorAction(request, async (cursor) => {
        if (filter(cursor.value) === true) {
            result.push(await requestAction(() => {
                return cursor.delete()
            }))
        }
        cursor.continue()
    })
    return { result: result.length } as IDBActionRequest<number>
}