# local-indexed

a lib for indexeddb

# install

```shell
npm instal @focme/local-indexed --save-dev
```

# usage

```javascript
import localIndexed from "@focme/local-indexed"

// get database
const database = localIndexed("database-name")
// get a collection
const store = database.collection("store-name")

// create database
await database.upgrade(async () => {
    // create store
    store.create({ keyPath: "id", autoIncreament: true })
    // create index
    store.createIndex("name", { unique: false })
    // init values
    await store.insert([{ ... }])
})

// get values
const items = await store.find() // get all values
// update value
await store.update({ id: 1, ... }) // update value witch id is 1
// delete value
await store.remove(1) // delete value witch id is 1

// use transaction
await database.transaction(async () => {
    // get cursor
    const cursor = store.find(item => item.id > 20)
    // update values
    cursor.update(item => { ... }) // update values witch id larger than 20
    // delete values
    cursor.remove() // delete values witch id larger than 20
})
```

# APIs

## static apis

* localIndexed.use(indexedDB: IDBFactory): void
* localIndexed.databases(): Promise\<IDBDatabaseInfo[]>
* localIndexed.deleteDatabase(database: string, indexedDB?: IDBFactory): Promise\<boolean>
* localIndexed.exists(database: string): Promise\<boolean>
* localIndexed.version(database: string): Promise\<number>

## LDBIndexed

### attributes

* LDBIndexed.name: string

### detial apis

* LDBIndexed.version(): Promise\<number>
* LDBIndexed.stores(): Promise\<string[]>

### transaction apis

* LDBIndexed.upgrade(callback: (event: LDBUpgradeEvent) => void | Promise<void>): Promise<void>
* LDBIndexed.upgrade(version: number, callback: (event: LDBUpgradeEvent) => void | Promise<void>): Promise<void>
* LDBIndexed.transaction(callback: () => void | Promise<void>): Promise<void>
* LDBIndexed.close(): void
* LDBIndexed.abort(): void

### collection apis

* LDBIndexed.collection\<T>(store: string): LDBCollection\<T>

## LDBCollection\<T>

### detial apis

* LDBCollection\<T>.info(): LDBCollectionInfo

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