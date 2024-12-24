import { cursorAction } from "./lib/cursor"
import { transactionAction } from "./lib/transaction"
import { type IDBActionRequest, requestAction } from "./lib/request"
import { type LDBContext } from "./context"

/**
 * cursor
 */
export interface LDBCursor<T> {
    /**
     * update values
     * 
     * @param formatter value formatter
     */
    update<K extends IDBValidKey>(formatter: (item: T) => any): Promise<K[]>
    /**
     * delete values
     */
    remove(): Promise<number>
    /**
     * get values
     * 
     * @param limit quantity limit
     * @param skip quantity skip
     */
    toList(limit?: number, skip?: number): Promise<T[]>
    /**
     * quantity number
     */
    count(): Promise<number>
}

/**
 * create cursor option
 */
export type LDBCursorOption<T> = {
    /**
     * cursor filter
     * 
     * return true to match current value
     * 
     * @param item value
     * @returns any
     */
    filter: (item: T) => any
    /**
     * index name
     * 
     * detemine use store cursor or index cursor
     * 
     * use store cursor if index name not exists
     */
    index?: string
    /**
     * cursor query
     */
    query?: IDBValidKey | IDBKeyRange
    /**
     * cursor direction
     */
    direction?: IDBCursorDirection
}

/**
 * get values
 * 
 * @param request open cursor request
 * @param filter cursor filter
 * @param limit quantity limit
 * @param skip quantity skip
 * @returns request like
 */
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

/**
 * delete values
 * 
 * @param request open cursor request
 * @param filter cursor filter
 * @returns request like
 */
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

/**
 * update valeus
 * 
 * update current value if the return value of formatter is not undefined or null
 * 
 * @param request open cursor request
 * @param filter cursor filter
 * @param formatter value formatter
 * @returns request like
 */
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
                if (target === true) return true

                result.push(await requestAction(() => {
                    return cursor.update(target)
                }))
            }
        }
        cursor.continue()
    })
    return { result } as IDBActionRequest<K[]>
}

/**
 * get quantity number
 * 
 * @param request open cursor request
 * @param filter cursor filter
 * @returns request like
 */
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

/**
 * create cursor
 * 
 * @param store store name
 * @param context indexed context
 * @param option cursor option
 * @returns cursor
 */
export function cursor<T>(store: string, context: LDBContext, option: LDBCursorOption<T>) {
    const { filter } = option
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
        const { index, query, direction } = option
        const { getTransaction, makeTransaction } = context
        // use global transction if exists
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
        // or create a transaction
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