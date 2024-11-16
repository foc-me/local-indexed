import { type LDBContext } from "./context"

/*
const cursor = collection.find((item) => {
    return true
}, {
    skip: 10,
    limit: 10,
    max: 100
})
cursor.next()
cursor.count()
cursor.toArray()

const query = await collection.find(item => {
    if () result.push()
    return true
})
query.set({ skip: 10, limit: 10, max: 100 })
const count = await result.count()
const result = await result.toArray()

const result = await collection.find((item) => {
    return item.name === ""
})
const result = await collection.findReverse((item) => {

})
const count = result.count()
const list = result.toArray({ skip: 10, limit: 10, direction: "prev" })
result.map(item => {
})

const cursor = collection.cursor(() => {})
const count = await cursor.count()
const result = await cursor.toArray({ skip: 10, limit: 10, direction: "prev" })

const indexCollection = collection.index()
*/

type LDBCursorOption = {
    direction?: IDBCursorDirection
    max?: number
    skip?: number
    limit?: number
}

interface LDBCursor<T extends object> {
    count(query?: (item: T) => boolean): Promise<number>
    toArray(): Promise<T[]>
    toArray(query?: (item: T) => boolean, option?: LDBCursorOption): Promise<T[]>
    toArray(option?: LDBCursorOption): Promise<T[]>
}

export function cursor<T extends object>(store: string, option: LDBCursorOption) {
    return {
        toArray: () => {

        }
    } as LDBCursor<T>
}