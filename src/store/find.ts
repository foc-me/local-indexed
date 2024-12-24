import { type IDBActionRequest, requestAction } from "../lib/request"

/**
 * get values
 * 
 * @param objectStore object store
 * @param keys key path values or key range
 * @param count quantity limit
 * @returns request
 */
export async function find<T>(
    objectStore: IDBObjectStore,
    keys?: IDBValidKey | IDBValidKey[] | IDBKeyRange,
    count?: number
) {
    if (Array.isArray(keys)) {
        const result: T[] = []
        for (let i = 0; i < keys.length; i++) {
            if (count === undefined || result.length < count) {
                result.push(await requestAction(() => {
                    return objectStore.get(keys[i])
                }))
            }
        }
        return { result } as IDBActionRequest<T[]>
    }
    return objectStore.getAll(keys, count)
}