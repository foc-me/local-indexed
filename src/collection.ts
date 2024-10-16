export interface LDBCollection {
    count: () => Promise<number>
    findOne: <T extends object>() => Promise<T>
    find: <T extends object>() => Promise<T[]>
    insert: () => Promise<void>
    delete: () => Promise<void>
}

export function collection(database: string, store: string) {
    return {} as LDBCollection
}