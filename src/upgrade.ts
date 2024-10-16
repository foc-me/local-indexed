import { upgradeDatabase } from "lib/upgrade"

// export interface LDBUpgradeStore {
//     createIndex: () => void
// }

// export interface LDBUpgradeContext {
//     createStore: (name: string, store: any) => LDBUpgradeStore
//     deleteStore: (name: string) => void
// }

export function upgrade(database: string, version: number) {
    return new Promise((resolve, reject) => {
        
    })
}