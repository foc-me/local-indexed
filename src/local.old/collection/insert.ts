import { type IDBActionRequest, requestAction } from "../../lib/request"

/**
 * insert one value
 * 
 * @param objectStore object store
 * @param value insert value
 * @returns request
 */
export function insertOne(objectStore: IDBObjectStore, value: any) {
    return objectStore.add(value)
}

/**
 * insert values
 * 
 * @param objectStore object store
 * @param values insert valeus
 * @returns keys
 */
export async function insertMany<K extends IDBValidKey>(objectStore: IDBObjectStore, values: any[]) {
    const result: K[] = []
    for (let i = 0; i < values.length; i++) {
        result.push(await requestAction(() => objectStore.add(values[i])))
    }
    return { result } as IDBActionRequest<K[]>
}