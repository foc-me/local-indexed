interface LDBUpgradeStore {
    createIndex: () => void
    
}

interface LDBUpgradeContext {
    createStore: (name: string, store: any) => LDBUpgradeStore
    deleteStore: (name: string) => void
}

export function upgrade(database: string, callback: (context: LDBUpgradeContext) => void) {

}