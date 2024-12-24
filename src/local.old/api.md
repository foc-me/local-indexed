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