export interface LDBCollection {
    count: () => Promise<number>
}

export function collection(database: string, store: string) {
    return {} as LDBCollection
}