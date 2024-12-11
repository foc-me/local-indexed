# local-indexed

a lib for indexeddb

# APIs

## static apis

* localIndexed.databases(): Promise\<IDBDatabaseInfo[]>
* localIndexed.deleteDatabase(database: string, indexedDB?: IDBFactory): Promise\<boolean>
* localIndexed.exists(database: string): Promise\<boolean>
* localIndexed.version(database: string): Promise\<number>
* localIndexed.use(indexedDB: IDBFactory): void

## LDBIndexed

### attributes

* LDBIndexed.name: string

### detial apis

* LDBIndexed.version(): Promise\<number>
* LDBIndexed.stores(): Promise\<string[]>
* LDBIndexed.close(): void

### transaction apis

* LDBIndexed.upgrade(callback: (event: LDBUpgradeEvent) => void | Promise<void>): Promise<void>
* LDBIndexed.upgrade(version: number, callback: (event: LDBUpgradeEvent) => void | Promise<void>): Promise<void>
* LDBIndexed.transaction(callback: () => void | Promise<void>): Promise<void>
* LDBIndexed.abort(): void

### collection apis

* LDBIndexed.collection\<T>(store: string): LDBCollection\<T>

### storage apis

* LDBIndexed.storage\<T>(store: string): LDBStorage\<T>

## LDBCollection\<T>

### create store apis

* LDBCollection\<T>.create(option?: LDBStoreOption): boolean
* LDBCollection\<T>.drop(): boolean
* LDBCollection\<T>.alter(option?: LDBStoreOption): boolean
* LDBCollection\<T>.createIndex(name: string, option?: LDBIndexOption): boolean
* LDBCollection\<T>.dropIndex(name: string): boolean

### collection apis

* LDBCollection\<T>.insert\<K extends IDBValidKey>(value: any): Promise\<K>
* LDBCollection\<T>.insert\<K extends IDBValidKey>(values: any[]): Promise\<K[]>
* LDBCollection\<T>.update\<K extends IDBValidKey>(value: any): Promise\<K>
* LDBCollection\<T>.update\<K extends IDBValidKey>(values: any[]): Promise\<K[]>
* LDBCollection\<T>.remove(key: IDBValidKey): Promise\<void>
* LDBCollection\<T>.remove(keys: IDBValidKey[]): Promise\<void>
* LDBCollection\<T>.remove(keyRnage: IDBKeyRange): Promise\<void>
* LDBCollection\<T>.find(key?: IDBValidKey | IDBKeyRange, count?: number): Promise\<T[]>
* LDBCollection\<T>.find(keys: IDBValidKey[]): Promise\<T[]>

### collection cursor apis

* LDBCollection\<T>.find(filter: (item: T) => boolean, option?: { sort: string, order: string }): LDBCursor\<T>

## LDBCursor\<T>

* LDBCursor\<T>.update\<K extends IDBValidKey>(filter: (item: T) => any): Promise\<K[]>
* LDBCursor\<T>.remove(): Promise\<number>
* LDBCursor\<T>.toList(limit?: number, skip?: number): Promise\<T[]>
* LDBCursor\<T>.count(): Promise\<number>

## LDBStorage\<T>

### create store apis

* LDBStorage\<T>.create(option?: LDBStoreOption): boolean
* LDBStorage\<T>.drop(): boolean
* LDBStorage\<T>.alter(option?: LDBStoreOption): boolean
* LDBStorage\<T>.createIndex(name: string, option?: LDBIndexOption): boolean
* LDBStorage\<T>.dropIndex(name: string): boolean

### storage apis

* LDBStorage\<T>.getItem(key: IDBValidKey): Promise\<T | undefined>
* LDBStorage\<T>.getItem(keyRange: IDBKeyRange): Promise\<T | undefined>
* LDBStorage\<T>.getItem(filter: (item: T) => boolean, option?: IDBCursorOption): Promise\<T | undefined>
* LDBStorage\<T>.setItem\<K extends IDBValidKey>(value: any): Promise\<K>
* LDBStorage\<T>.setItem\<K extends IDBValidKey>(values: any[]): Promise\<K[]>
* LDBStorage\<T>.setItem\<K extends IDBValidKey>(filter: (item: T) => any, option?: IDBCursorOption): Promise\<K[]>
* LDBStorage\<T>.removeItem(key: IDBValidKey): Promise\<void>
* LDBStorage\<T>.removeItem(filter: (item: T) => boolean, option?: IDBCursorOption): Promise\<number>
* LDBStorage\<T>.clear(key?: IDBValidKey | IDBKeyRange): Promise\<void>
* LDBStorage\<T>.clear(filter: (item: T) => boolean, option?: IDBCursorOption): Promise\<number>
* LDBStorage\<T>.length(key?: IDBValidKey | IDBKeyRange): Promise\<number>
* LDBStorage\<T>.length(filter: (item: T) => boolean, option?: IDBCursorOption): Promise\<number>
* LDBStorage\<T>.values(key?: IDBValidKey | IDBKeyRange): Promise\<T[]>
* LDBStorage\<T>.values(filter: (item: T) => boolean, option?: IDBCursorOption): Promise\<T[]>

### storage index apis

* LDBStorage\<T>.getIndexes(): Promise\<LDBIndexDetials>
* LDBStorage\<T>.index(name: string): LDBIndexStorage

### storage key apis

* LDBStorage\<T>.getKey\<K extends IDBKeyRange>(key?: IDBValidKey | IDBKeyRange): Promise\<K>
* LDBStorage\<T>.getKey\<K extends IDBKeyRange>(filter: (key: K) => boolean, option?: IDBCursorOption): Promise\<K>
* LDBStorage\<T>.keys\<K extends IDBKeyRange>(key?: IDBValidKey | IDBKeyRange): Promise\<K[]>
* LDBStorage\<T>.keys\<K extends IDBKeyRange>(filter: (key: K) => boolean, option?: IDBCursorOption): Promise\<K[]>

## LDBIndexStorage\<T>

### index storage apis

* LDBIndexStorage\<T>.setItem\<K extends IDBValidKey>(filter: (item: T) => any, option?: IDBCursorOption): Promise\<K[]>
* LDBIndexStorage\<T>.getItem(filter: (item: T) => boolean, option?: IDBCursorOption): Promise\<T | undefined>
* LDBIndexStorage\<T>.removeItem(filter: (item: T) => boolean, option?: IDBCursorOption): Promise\<number>
* LDBIndexStorage\<T>.length(key?: IDBValidKey | IDBKeyRange): Promise\<number>
* LDBIndexStorage\<T>.length(filter: (item: T) => boolean, option?: IDBCursorOption): Promise\<number>
* LDBIndexStorage\<T>.values(key?: IDBValidKey | IDBKeyRange): Promise\<T[]>
* LDBIndexStorage\<T>.values(filter: (item: T) => boolean, option?: IDBCursorOption): Promise\<T[]>

### index storage key apis

* LDBStorage\<T>.getKey\<K extends IDBKeyRange>(key?: IDBValidKey | IDBKeyRange): Promise\<K>
* LDBStorage\<T>.getKey\<K extends IDBKeyRange>(filter: (key: K) => boolean, option?: IDBCursorOption): Promise\<K>
* LDBStorage\<T>.keys\<K extends IDBKeyRange>(key?: IDBValidKey | IDBKeyRange): Promise\<K[]>
* LDBStorage\<T>.keys\<K extends IDBKeyRange>(filter: (key: K) => boolean, option?: IDBCursorOption): Promise\<K[]>