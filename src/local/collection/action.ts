import { requestAction, type IDBRequestLike } from "../../lib/request"
import { cursorAction } from "../../lib/cursor"

/**
 * object store index detials
 */
export type IDBIndexInfo = {
    name: string
    keyPath: string | string[]
    unique: boolean
    multiEntry: boolean
}

export function insertOne(objectStore: IDBObjectStore, value: any) {
    return objectStore.add(value)
}

export async function insertMany<K extends IDBValidKey>(objectStore: IDBObjectStore, values: any[]) {
    const result: K[] = []
    for (let i = 0; i < values.length; i++) {
        result.push(await requestAction(() => objectStore.add(values[i])))
    }
    return { result } as IDBRequestLike<K[]>
}

export function update(objectStore: IDBObjectStore, value: any) {
    return objectStore.put(value)
}

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
    return { result } as IDBRequestLike<K>
}

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
    return { result } as IDBRequestLike<K[]>
}

export function remove(objectStore: IDBObjectStore, value: IDBValidKey | IDBKeyRange) {
    return objectStore.delete(value)
}

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
    return { result: result.length } as IDBRequestLike<number>
}

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
    return { result: result.length } as IDBRequestLike<number>
}

export function getIndexes(objectStore: IDBObjectStore) {
    const indexNames = [...objectStore.indexNames]
    const result: IDBIndexInfo[] = []
    for (let i = 0; i < indexNames.length; i++) {
        const { name, keyPath, unique, multiEntry } = objectStore.index(indexNames[i])
        result.push({ name, keyPath, unique, multiEntry })
    }
    return { result } as IDBRequestLike<IDBIndexInfo[]>
}

export async function find<T extends object>(
    objectStore: IDBObjectStore,
    filter?: IDBValidKey | IDBKeyRange | ((item: T) => boolean)
) {
    if (filter === undefined || typeof filter === "function") {
        const results = await requestAction(() => {
            return objectStore.getAll()
        })
        return { result: filter ? results.filter(filter) : results }  as IDBRequestLike<T[]>
    }
    return objectStore.get(filter) as IDBRequest<T[]>
}

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
    return { result } as IDBRequestLike<T>
}

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
    return { result } as IDBRequestLike<T[]>
}