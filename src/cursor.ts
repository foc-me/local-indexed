import { cursorAction } from "./lib/cursor"
import { transactionAction } from "./lib/transaction"
import { type IDBActionRequest, requestAction } from "./lib/request"
import { type LDBContext } from "./context"

export interface LDBCursor<T> {
    update<K extends IDBValidKey>(formatter: (item: T) => any): Promise<K[]>
    remove(): Promise<number>
    toList(limit?: number, skip?: number): Promise<T[]>
    count(): Promise<number>
}

export type LDBCursorOption = {
    index?: string
    query?: IDBValidKey | IDBKeyRange
    direction?: IDBCursorDirection
}

async function toList<T>(
    request: IDBRequest<IDBCursorWithValue | null>,
    filter: (item: T) => any,
    limit?: number,
    skip?: number
) {
    const result: T[] = []
    if (typeof limit === "number" && limit < 1) {
        return { result } as IDBActionRequest<T[]>
    }

    await cursorAction(request, (cursor) => {
        const match = filter(cursor.value) === true
        if (match) {
            if (typeof skip === "number" && skip > 0) {
                skip--
            } else if (limit === undefined || result.length < limit) {
                result.push(cursor.value)
            } else {
                return true
            }
        }
        cursor.continue()
    })
    return { result } as IDBActionRequest<T[]>
}

async function remove(
    request: IDBRequest<IDBCursorWithValue | null>,
    filter: (item: any) => any
) {
    let result = 0
    await cursorAction(request, (cursor) => {
        if (filter(cursor.value) === true) {
            cursor.delete()
            result++
        }
        cursor.continue()
    })
    return { result } as IDBActionRequest<number>
}

async function update<K extends IDBValidKey>(
    request: IDBRequest<IDBCursorWithValue | null>,
    filter: (item: any) => any,
    formatter: (item: any) => any
) {
    const result: K[] = []
    await cursorAction(request, async (cursor) => {
        if (filter(cursor.value) === true) {
            const target = formatter(cursor.value)
            if (target !== undefined && target !== null) {
                result.push(await requestAction(() => {
                    cursor.update(target)
                }))
            }
        }
        cursor.continue()
    })
    return { result } as IDBActionRequest<K[]>
}

async function count(
    request: IDBRequest<IDBCursorWithValue | null>,
    filter: (item: any) => any
) {
    let result = 0
    await cursorAction(request, (cursor) => {
        if (filter(cursor.value) === true) {
            result++
        }
        cursor.continue()
    })
    return { result } as IDBActionRequest<number>
}

export function cursor<T>(
    store: string,
    context: LDBContext,
    filter: (item: T) => boolean,
    option?: LDBCursorOption
) {
    /**
     * get current objectStore from context
     * 
     * @param mode transaction mode
     * @param callback transaction action
     * @returns request
     */
    const makeCursorAction = async <T>(
        mode: IDBTransactionMode,
        callback: (request: IDBRequest<IDBCursorWithValue | null>) => IDBActionRequest | Promise<IDBActionRequest>
    ) => {
        const { index, query, direction } = option || {}
        const { getTransaction, makeTransaction } = context
        const current = getTransaction()
        if (current) {
            const objectStore = current.objectStore(store)
            const cursorRequest = index
                ? objectStore.index(index).openCursor(query, direction)
                : objectStore.openCursor(query, direction)
            return requestAction<T>(() => {
                return callback(cursorRequest)
            })
        }
        const transaction = await makeTransaction(store, mode)
        return transactionAction<T>(transaction, () => {
            const objectStore = transaction.objectStore(store)
            const cursorRequest = index
                ? objectStore.index(index).openCursor(query, direction)
                : objectStore.openCursor(query, direction)
            return callback(cursorRequest)
        }).finally(() => {
            context.setTransaction()
        })
    }

    return {
        toList: (limit, skip) => {
            return makeCursorAction("readonly", (request) => {
                return toList(request, filter, limit, skip)
            })
        },
        remove: () => {
            return makeCursorAction("readwrite", (request) => {
                return remove(request, filter)
            })
        },
        update: (formatter) => {
            return makeCursorAction("readwrite", (request) => {
                return update(request, filter, formatter)
            })
        },
        count: () => {
            return makeCursorAction("readonly", (request) => {
                return count(request, filter)
            })
        },
    } as LDBCursor<T>
}