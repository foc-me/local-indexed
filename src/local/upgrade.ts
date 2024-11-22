import { upgradeAction, type IDBUpgradeEvent } from "../lib/upgrade"
import { makeContext, type LDBContext } from "./context"
import { collection, type LDBCollection } from "./collection"

export interface LDBUpgradeContext {
    oldVersion: number
    newVersion: number
    collection<T extends object>(store: string): LDBCollection<T>
}

function makeUpgradeContext(event: IDBUpgradeEvent, context: LDBContext) {
    const { transaction, oldVersion, newVersion } = event
    const { database, indexedDB } = context
    const collectionContext = makeContext(database, indexedDB, transaction)

    return {
        oldVersion,
        newVersion,
        collection: <T extends object>(store: string) => {
            return collection<T>(store, collectionContext)
        }
    } as LDBUpgradeContext
}

export async function upgrade(
    version: number,
    action: (context: LDBUpgradeContext) => void,
    context: LDBContext
) {
    const { database } = context
    await upgradeAction(database, version, (event) => {
        return action(makeUpgradeContext(event, context))
    })
}