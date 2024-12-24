import { type IDBActionRequest, requestAction } from "../lib/request"

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
 * update valeus
 * 
 * @param objectStore object store
 * @param values values
 * @returns request like
 */
export async function updateMany(objectStore: IDBObjectStore, values: any[]) {
    const result: IDBValidKey[] = []
    for (let i = 0; i < values.length; i++) {
        result.push(await requestAction(() => {
            return objectStore.put(values[i])
        }))
    }
    return { result } as IDBActionRequest<IDBValidKey[]>
}