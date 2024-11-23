import { cursorAction } from "../../lib/cursor"
import { type IDBActionRequest, requestAction } from "../../lib/request"

/**
 * object store index detials
 */
export type IDBIndexInfo = {
    name: string
    keyPath: string | string[]
    unique: boolean
    multiEntry: boolean
}

/**
 * insert one value
 * 
 * @param objectStore object store
 * @param value insert value
 * @returns add request
 */
export function insertOne(objectStore: IDBObjectStore, value: any) {
    return objectStore.add(value)
}

/**
 * insert values
 * 
 * @param objectStore object store
 * @param values insert valeus
 * @returns add request
 */
export async function insertMany<K extends IDBValidKey>(objectStore: IDBObjectStore, values: any[]) {
    const result: K[] = []
    for (let i = 0; i < values.length; i++) {
        result.push(await requestAction(() => objectStore.add(values[i])))
    }
    return { result } as IDBActionRequest<K[]>
}

/**
 * update one value
 * 
 * @param objectStore object store
 * @param value update value
 * @returns put request
 */
export function update(objectStore: IDBObjectStore, value: any) {
    return objectStore.put(value)
}

/**
 * update one value with cursor
 * 
 * close cursor after first value updated
 * 
 * @param objectStore object store
 * @param filter cursor filter
 * @param option cursor option
 * @returns affected ids
 */
export async function updateOne<T extends object, K extends IDBValidKey>(
    objectStore: IDBObjectStore,
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
 * update values with cursor
 * 
 * @param objectStore object store
 * @param filter cursor filter
 * @param option cursor option
 * @returns affected ids
 */
export async function updateMany<T extends object, K extends IDBValidKey>(
    objectStore: IDBObjectStore,
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

/**
 * delete value by keys
 * 
 * @param objectStore object store
 * @param value delete keys
 * @returns delete request
 */
export function remove(objectStore: IDBObjectStore, value: IDBValidKey | IDBKeyRange) {
    return objectStore.delete(value)
}

/**
 * delete value with cursor
 * 
 * close cursor after first value deleted
 * 
 * @param objectStore object store
 * @param filter cursor filter
 * @param option cursor option
 * @returns rows affected number
 */
export async function removeOne<T extends object>(
    objectStore: IDBObjectStore,
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
 * delete values with cursor
 * 
 * @param objectStore object store
 * @param filter cursor filter
 * @param option cursor option
 * @returns rows affected number
 */
export async function removeMany<T extends object>(
    objectStore: IDBObjectStore,
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

/**
 * get index detials in specified object store
 * 
 * @param objectStore object store
 * @returns index details
 */
export function getIndexes(objectStore: IDBObjectStore) {
    const indexNames = [...objectStore.indexNames]
    const result: IDBIndexInfo[] = []
    for (let i = 0; i < indexNames.length; i++) {
        const { name, keyPath, unique, multiEntry } = objectStore.index(indexNames[i])
        result.push({ name, keyPath, unique, multiEntry })
    }
    return { result } as IDBActionRequest<IDBIndexInfo[]>
}

/**
 * get values from specified object store
 * 
 * @param objectStore object store
 * @param filter values filter
 * @returns get request
 */
export async function find<T extends object>(
    objectStore: IDBObjectStore,
    filter?: IDBValidKey | IDBKeyRange | ((item: T) => boolean)
) {
    if (filter === undefined || typeof filter === "function") {
        const results = await requestAction(() => {
            return objectStore.getAll()
        })
        return { result: filter ? results.filter(filter) : results }  as IDBActionRequest<T[]>
    }
    return objectStore.get(filter) as IDBRequest<T[]>
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
export async function findOne<T extends object>(
    objectStore: IDBObjectStore,
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
 * get values with cursor
 * 
 * @param objectStore object store
 * @param filter cursor filter
 * @param option cursor option
 * @returns values
 */
export async function findMany<T extends object>(
    objectStore: IDBObjectStore,
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