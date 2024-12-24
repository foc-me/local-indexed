import { type IDBActionRequest, requestAction } from "../lib/request"

/**
 * insert value
 * 
 * @param objectStore object store
 * @param value value
 * @returns request
 */
export function insertOne(objectStore: IDBObjectStore, value: any) {
    return objectStore.add(value)
}

/**
 * insert values
 * 
 * @param objectStore object store
 * @param values values
 * @returns request like
 */
export async function insertMany(objectStore: IDBObjectStore, values: any[]) {
    const result: IDBValidKey[] = []
    for (let i = 0; i < values.length; i++) {
        result.push(await requestAction(() => {
            return objectStore.add(values[i])
        }))
    }
    return { result } as IDBActionRequest<IDBValidKey[]>
}