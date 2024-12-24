import { getDatabase } from "../lib/database"

/**
 * get store names from database
 * 
 * @param database database name
 * @returns store names
 */
export async function stores(database: string, indexedDB?: IDBFactory) {
    const db = await getDatabase(database, indexedDB)
    db.close()
    return [...db.objectStoreNames]
}