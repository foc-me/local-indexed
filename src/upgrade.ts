import { upgradeDatabase } from "lib/upgrade"

export interface LDBUpgradeObjectStore {
    createIndex: () => void
    deleteIndex: () => void
    put: () => void
}

export interface LDBUpgradeStore {
    createStore: (name: string, store: any) => LDBUpgradeObjectStore
    deleteStore: (name: string) => void
}

export async function upgrade(database: string, version: number, callback: Function) {
    await upgradeDatabase(database, version, (context) => {

    })
}