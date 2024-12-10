# local-indexed

a lib for indexeddb

# APIs

## LDBCollection\<T>

### create store apis

* LDBCollection\<T>.create(option: LDBStoreOption): void
* LDBCollection\<T>.drop(): void
* LDBCollection\<T>.alter(option: LDBStoreOption): void
* LDBCollection\<T>.createIndex(name: string, option: LDBIndexOption): void
* LDBCollection\<T>.dropIndex(name: string): void

### store collection apis

* LDBCollection\<T>.insert\<K extends IDBValidKey>(value: any): Promise\<K>
* LDBCollection\<T>.insert\<K extends IDBValidKey>(values: any[]): Promise\<K[]>
* LDBCollection\<T>.update\<K extends IDBValidKey>(value: any): Promise\<K>
* LDBCollection\<T>.update\<K extends IDBValidKey>(values: any[]): Promise\<K[]>
* LDBCollection\<T>.remove(key: IDBValidKey): Promise\<void>
* LDBCollection\<T>.remove(keyRange: IDBValidKey[]): Promise\<void>
* LDBCollection\<T>.find(key: IDBValidKey): Promise\<T | undefined>
* LDBCollection\<T>.find(keys: IDBValidKey[]): Promise\<T[]>
* LDBCollection\<T>.find(keyRnage: IDBKeyRange): Promise\<T[]>
* LDBCollection\<T>.find((item: T) => boolean, option?: { sort: string, order: string }): LDBCursor\<T>

## LDBCursor\<T>

* LDBCursor\<T>.update\<K extends IDBValidKey>((item: T) => any): Promise\<K[]>
* LDBCursor\<T>.remove\<K extends IDBValidKey>(): Promise\<K[]>
* LDBCursor\<T>.toList(limit: number, skip: number): Promise\<T[]>
* LDBCursor\<T>.count(): Promise\<number>

## LDBStorage\<T>

### create store apis

* LDBStorage\<T>.create(option: LDBStoreOption): void
* LDBStorage\<T>.drop(): void
* LDBStorage\<T>.alter(option: LDBStoreOption): void
* LDBStorage\<T>.createIndex(name: string, option: LDBIndexOption): void
* LDBStorage\<T>.dropIndex(name: string): void

### store storage apis

* LDBStorage\<T>.setItem\<K extends IDBValidKey>(value: any): Promise\<K>
* LDBStorage\<T>.setItem\<K extends IDBValidKey>((item: T) => any, option?: IDBCursorOption): Promise\<K>
* LDBStorage\<T>.setItems\<K extends IDBValidKey>(values: any[]): Promise\<K[]>
* LDBStorage\<T>.setItems\<K extends IDBValidKey>((item: T) => any, option?: IDBCursorOption): Promise\<K[]>
* LDBStorage\<T>.getItem(key: IDBValidKey): Promise\<T>
* LDBStorage\<T>.getItem((item: T) => boolean, option?: IDBCursorOption): Promise\<T>
* LDBStorage\<T>.getItems(keyRange: IDBKeyRange): Promise\<T[]>
* LDBStorage\<T>.getItems((item: T) => boolean, option?: IDBCursorOption): Promise\<T[]>
* LDBStorage\<T>.removeItem(key: IDBValidKey): Promise\<number>
* LDBStorage\<T>.removeItem((item: T) => boolean, option?: IDBCursorOption): Promise\<number>
* LDBStorage\<T>.removeItems(keyRange: IDBKeyRange): Promise\<number>
* LDBStorage\<T>.removeItems((item: T) => boolean, option?: IDBCursorOption): Promise\<number>
* LDBStorage\<T>.clear(): Promise\<void>
* LDBStorage\<T>.length(key: IDBValidKey): Promise\<number>
* LDBStorage\<T>.length(keyRange: IDBKeyRange): Promise\<number>
* LDBStorage\<T>.length((item: T) => boolean, option?: IDBCursorOption): Promise\<number>
* LDBStorage\<T>.key\<K extends IDBKeyRange>(key?: IDBValidKey | IDBKeyRange): Promise\<K>
* LDBStorage\<T>.keys\<K extends IDBKeyRange>(key?: IDBValidKey | IDBKeyRange): Promise\<K[]>
* LDBStorage\<T>.values(key?: IDBValidKey | IDBKeyRange): Promise\<T[]>
* LDBStorage\<T>.values((item: T) => boolean, option?: IDBCursorOption): Promise\<T[]>
* LDBStorage\<T>.getIndexes(g): Promise\<LDBIndexDetials>
* LDBStorage\<T>.index(name: string): LDBIndexStorage

## LDBIndexStorage\<T>

* LDBIndexStorage\<T>.setItem\<K extends IDBValidKey>((item: T) => any, option?: IDBCursorOption): Promise\<K>
* LDBIndexStorage\<T>.setItems\<K extends IDBValidKey>((item: T) => any, option?: IDBCursorOption): Promise\<K[]>
* LDBIndexStorage\<T>.getItem(key: IDBValidKey): Promise\<T>
* LDBIndexStorage\<T>.getItem((item: T) => boolean, option?: IDBCursorOption): Promise\<T>
* LDBIndexStorage\<T>.getItems(keyRange: IDBKeyRange): Promise\<T[]>
* LDBIndexStorage\<T>.getItems((item: T) => boolean, option?: IDBCursorOption): Promise\<T[]>
* LDBIndexStorage\<T>.removeItem((item: T) => boolean, option?: IDBCursorOption): Promise\<void>
* LDBIndexStorage\<T>.removeItems((item: T) => boolean, option?: IDBCursorOption): Promise\<void>
* LDBIndexStorage\<T>.length(key: IDBValidKey): Promise\<number>
* LDBIndexStorage\<T>.length(keyRange: IDBKeyRange): Promise\<number>
* LDBIndexStorage\<T>.length((item: T) => boolean, option?: IDBCursorOption): Promise\<number>
* LDBIndexStorage\<T>.key\<K extends IDBKeyRange>(key?: IDBValidKey | IDBKeyRange): Promise\<K>
* LDBIndexStorage\<T>.keys\<K extends IDBKeyRange>(key?: IDBValidKey | IDBKeyRange): Promise\<K[]>
* LDBIndexStorage\<T>.values(key?: IDBValidKey | IDBKeyRange): Promise\<T[]>
* LDBIndexStorage\<T>.values((item: T) => boolean, option?: IDBCursorOption): Promise\<T[]>
