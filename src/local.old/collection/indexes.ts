import { type IDBActionRequest } from "../../lib/request"

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