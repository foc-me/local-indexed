import { type LDBContext } from "../context"

export interface LDBCollection<T> {
    
}

export function collection<T>(context: LDBContext, store: string) {
    return {} as LDBCollection<T>
}