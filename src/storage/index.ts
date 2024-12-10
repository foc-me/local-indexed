import { type LDBContext } from "../context"

/**
 * create index option
 */
export type LDBIndexOption = {
    keyPath?: string | Iterable<string>
    unique?: boolean
    multiEntry?: boolean
}

/**
 * create object store option
 */
export type LDBStoreOption = {
    keyPath?: string | string[] | null
    autoIncrement?: boolean
    index?: Record<string, LDBIndexOption>
}

export interface LDBStorage<T> {
    create(option?: LDBStoreOption): void
    drop(): void
    alter(option?: LDBStoreOption): void
    createIndex(name: string, option?: LDBIndexOption): void
    dropIndex(name: string): void
}

export function storage<T>(context: LDBContext, store: string) {
    return {} as LDBStorage<T>
}