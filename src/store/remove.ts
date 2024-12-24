import { type IDBActionRequest, requestAction } from "../lib/request"

/**
 * delete values
 * 
 * @param objectStore object store
 * @param keys key path values or key range
 * @returns request
 */
export async function remove(
    objectStore: IDBObjectStore,
    keys: IDBValidKey | IDBValidKey[] | IDBKeyRange
) {
    if (Array.isArray(keys)) {
        for (let i = 0; i < keys.length; i++) {
            await requestAction(() => {
                return objectStore.delete(keys[i])
            })
        }
        return undefined as IDBActionRequest<undefined>
    }
    return objectStore.delete(keys)
}