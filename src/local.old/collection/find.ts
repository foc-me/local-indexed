import { cursorAction } from "../../lib/cursor"
import { type IDBActionRequest } from "../../lib/request"

/**
 * get value
 * 
 * @param objectStore object store
 * @param value key value
 * @returns request
 */
export function findOne(objectStore: IDBObjectStore | IDBIndex, value: IDBValidKey) {
    return objectStore.get(value)
}

/**
 * get value with cursor
 * 
 * close cursor after first value finded
 * 
 * @param objectStore object store
 * @param filter cursor filter
 * @param option cursor option
 * @returns value
 */
export async function findOneCursor<T extends object>(
    objectStore: IDBObjectStore | IDBIndex,
    filter: (item: T) => boolean,
    option?: {
        query?: IDBValidKey | IDBKeyRange,
        direction?: IDBCursorDirection
    }
) {
    const { query, direction } = option || {}
    const request = objectStore.openCursor(query, direction)
    const result = await cursorAction<T | undefined>(request, (cursor) => {
        if (filter(cursor.value) === true) {
            return cursor.value
        } else cursor.continue()
    })
    return { result } as IDBActionRequest<T>
}

/**
 * get values
 * 
 * @param objectStore object store or index
 * @param range key range
 * @returns request
 */
export function findManyKeyRange(objectStore: IDBObjectStore | IDBIndex, range?: IDBValidKey | IDBKeyRange) {
    return objectStore.getAll(range)
}

/**
 * get values with cursor
 * 
 * @param objectStore object store
 * @param filter cursor filter
 * @param option cursor option
 * @returns values
 */
export async function findManyCursor<T extends object>(
    objectStore: IDBObjectStore | IDBIndex,
    filter: (item: T) => boolean,
    option?: {
        query?: IDBValidKey | IDBKeyRange,
        direction?: IDBCursorDirection
    }
) {
    const { query, direction } = option || {}
    const request = objectStore.openCursor(query, direction)
    const result: T[] = []
    await cursorAction(request, (cursor) => {
        if (filter(cursor.value) === true) {
            result.push(cursor.value)
        }
        cursor.continue()
    })
    return { result } as IDBActionRequest<T[]>
}