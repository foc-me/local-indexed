# local-indexed

A lib for indexeddb.

## Install

### Use npm module

```shell
npm instal @focme/local-indexed --save
```

```javascript
// esm
import localIndexed from "@focme/local-indexed"

const database = localIndexed("database-name")
```

```javascript
// cjs
const localIndexed = require("@focme/local-indexed")

const database = localIndexed("database-name")
```

### Use release package

Download the <a href="https://github.com/foc-me/local-indexed/releases">release package</a>.

```html
<script src="path-to-the-package-location"/>
<script>
const database = window.localIndexed("database-name")
</script>
```

## Usage

### Use `upgrade`

The `upgrade` function is mainly used to create database and manage store settings.
Call it before any other functions
as most of them will get exception if the database does not exist.

APIs like create/drop store and create/drop index functions can only be called in `upgrade` function.

Create database, store and index.

```javascript
import localIndexed from "@focme/local-indexed"

const database = localIndexed("database-name")
const store = database.collection("store-name")

// create database
await database.upgrade(async () => {
    // create store
    store.create({ keyPath: "id" })
    // create index
    store.createIndex("name", { unique: false })

    // init values
    await store.insert([
        { id: 1, name: "John" },
        { id: 2, name: "Anny" }
    ])
})
```

Alter store.

```javascript
import localIndexed from "@focme/local-indexed"

const database = localIndexed("database-name")
const store = database.collection("store-name")

// upgrade database
await database.upgrade(async () => {
    // backup values
    const values = await store.find() // get all values
    // alter store
    store.alter({ keyPath: "id", autoIncrement: true })

    // insert values
    await store.insert(values)
})
```

### Use `transaction`

The `transaction` function is mainly used to modify and delete data.

```javascript
import localIndexed from "@focme/local-indexed"

const database = localIndexed("database-name")
const store = database.collection("store-name")

await database.transaction(async () => {
    // update values
    await store.update([
        { id: 1, firstName: "John", lastName: "Wilson" },
        { id: 2, firstName: "Anny", lastName: "Park" }
    ])
    // delete value 1
    await store.delete(1)
})
```

### Use `abort`

The `upgrade` and `transaction` are all transactions with different type so that all of them support rollback operation.

```javascript
import localIndexed from "@focme/local-indexed"

const database = localIndexed("database-name")
const store = database.collection("store-name")

await database.upgrade(async () => {
    const values = await store.find()
    store.alter({ keyPath: "id", autoIncrement: true })
    await store.insert(values)

    // abort upgrade
    database.abort()
})

await database.transaction(async () => {
    await store.update([
        { id: 1, firstName: "John", lastName: "Wilson" },
        { id: 2, firstName: "Anny", lastName: "Park" }
    ])
    await store.delete(1)

    // abort transaction
    database.abort()
})
```

### Use `collection`

Select, update and delete values.

```javascript
import localIndexed from "@focme/local-indexed"

const database = localIndexed("database-name")
const store = database.collection("store-name")

// select values
const values = await store.find()
// const values = await store.find([1, 2, 3])
// const values = await store.find(IDBKeyRange.bound(1, 10))

// update value
await store.update({ id: 1, ... })
await store.update([
    { id: 1, ... },
    { id: 2, ... }
])

// delete values
await store.remove(1)
await store.remove([1, 2, 3])
await store.remove(IDBKeyRange.bound(1, 10))
```

> Rollback cannot be performed when calling `update` or `remove` methods outside of `upgrade` and `transaction`,
> even if an exception is thrown

### Use `cursor`

With a cursor object you can select, update and delete values.

A `cursor` is a process of traversing data that can provide more precise matching rules.

```javascript
import localIndexed from "@focme/local-indexed"

const database = localIndexed("database-name")
const store = database.collection("store-name")

const cursor = store.find((item) => item.id > 10 && item.id < 21)

// select values
const list = await cursor.toList()
// const list = await cursor.toList(20, 10) // limit 20 skip 10

// update values
await cursor.update(item => ({ id: item.id, ... }))

// delete values
await cursor.delete()
```

### About exported types

All types starting with "LDB" in this document have no corresponding constructors.
As `LDBCollection` is the return type of `LDBIndexed.collection()` function
and there is no function named `LDBCollection` as a constructor.

And all types starting with "IDB" are built-in browser environments.

## APIs

### static apis

* <a href="#localIndexed.use">localIndexed.use(indexedDB: IDBFactory): void</a>
* <a href="#localIndexed.databases">localIndexed.databases(indexedDB?: IDBFactory): Promise\<IDBDatabaseInfo[]></a>
* <a href="#localIndexed.delete">localIndexed.delete(database: string, indexedDB?: IDBFactory): Promise\<boolean></a>
* <a href="#localIndexed.exists">localIndexed.exists(database: string, indexedDB?: IDBFactory): Promise\<boolean></a>
* <a href="#localIndexed.version">localIndexed.version(database: string, indexedDB?: IDBFactory): Promise\<number></a>

### localIndexed

* <a href="#localIndexed">localIndexed(database: string, indexedDB?: IDBFactory): LDBIndexed</a>

### <a href="#LDBIndexed">LDBIndexed</a>

**attributes**

* <a href="#LDBIndexed.name">LDBIndexed.name: string</a>

**detail apis**

* <a href="#LDBIndexed.version">LDBIndexed.version(): Promise\<number></a>
* <a href="#LDBIndexed.stores">LDBIndexed.stores(): Promise\<string[]></a>

**transaction apis**

* <a href="#LDBIndexed.upgrade">LDBIndexed.upgrade(callback?: (event: LDBUpgradeEvent) => void | Promise\<void>): Promise\<void></a>
* <a href="#LDBIndexed.upgrade2">LDBIndexed.upgrade(version: number, callback?: (event: LDBUpgradeEvent) => void | Promise\<void>): Promise\<void></a>
* <a href="#LDBIndexed.transaction">LDBIndexed.transaction(callback?: () => void | Promise\<void>): Promise\<void></a>
* <a href="#LDBIndexed.abort">LDBIndexed.abort(): void</a>
* <a href="#LDBIndexed.close">LDBIndexed.close(): void</a>

**collection apis**

* <a href="#LDBIndexed.collection">LDBIndexed.collection\<T>(store: string): LDBCollection\<T></a>

### <a href="#LDBCollection">LDBCollection\<T></a>

**detail apis**

* <a href="#LDBCollection.info">LDBCollection\<T>.info(): Promise\<LDBStoreInfo></a>
* <a href="#LDBCollection.exists">LDBCollection\<T>.exists(): Promise\<boolean></a>

**upgrade apis**

* <a href="#LDBCollection.create">LDBCollection\<T>.create(option?: LDBStoreOption): boolean</a>
* <a href="#LDBCollection.drop">LDBCollection\<T>.drop(): boolean</a>
* <a href="#LDBCollection.alter">LDBCollection\<T>.alter(option?: LDBStoreOption): boolean</a>
* <a href="#LDBCollection.createIndex">LDBCollection\<T>.createIndex(name: string, option?: LDBIndexOption): boolean</a>
* <a href="#LDBCollection.dropIndex">LDBCollection\<T>.dropIndex(name: string): boolean</a>

**collection apis**

* <a href="#LDBCollection.insert">LDBCollection\<T>.insert\<K extends IDBValidKey>(value: any): Promise\<K></a>
* <a href="#LDBCollection.insert2">LDBCollection\<T>.insert\<K extends IDBValidKey>(values: any[]): Promise\<K[]></a>
* <a href="#LDBCollection.update">LDBCollection\<T>.update\<K extends IDBValidKey>(value: any): Promise\<K></a>
* <a href="#LDBCollection.update2">LDBCollection\<T>.update\<K extends IDBValidKey>(values: any[]): Promise\<K[]></a>
* <a href="#LDBCollection.remove">LDBCollection\<T>.remove(key: IDBValidKey): Promise\<void></a>
* <a href="#LDBCollection.remove2">LDBCollection\<T>.remove(keys: IDBValidKey[]): Promise\<void></a>
* <a href="#LDBCollection.remove3">LDBCollection\<T>.remove(keyRange: IDBKeyRange): Promise\<void></a>
* <a href="#LDBCollection.find">LDBCollection\<T>.find(): Promise\<T[]></a>
* <a href="#LDBCollection.find2">LDBCollection\<T>.find(key: IDBValidKey | IDBKeyRange, count?: number): Promise\<T[]></a>
* <a href="#LDBCollection.find3">LDBCollection\<T>.find(keys: IDBValidKey[]): Promise\<T[]></a>

**cursor apis**

* <a href="#LDBCollection.find4">LDBCollection\<T>.find(filter: (item: T) => boolean): LDBCursor\<T></a>
* <a href="#LDBCollection.find5">LDBCollection\<T>.find(option: LDBCollectionCursor\<T>): LDBCursor\<T></a>

### <a href="#LDBCursor">LDBCursor\<T></a>

* <a href="#LDBCursor.update">LDBCursor\<T>.update\<K extends IDBValidKey>(formatter: (item: T) => any): Promise\<K[]></a>
* <a href="#LDBCursor.remove">LDBCursor\<T>.remove(): Promise\<number></a>
* <a href="#LDBCursor.toList">LDBCursor\<T>.toList(limit?: number, skip?: number): Promise\<T[]></a>
* <a href="#LDBCursor.count">LDBCursor\<T>.count(): Promise\<number></a>

## API detials

### static apis

* <a id="localIndexed.use">localIndexed.use(indexedDB: IDBFactory): void</a>
    * param `indexedDB: IDBFactory`: the indexedDB factory

    Set the global indexedDB factory.

    ```javascript
    import { indexedDB } from "fake-indexeddb"
    import localIndexed from "@focme/local-indexed"

    // use fake-indexeddb instead of globalThis.indexedDB
    localIndexed.use(indexedDB)
    ```

    > You can also specify the current indexedDB factory using "localIndexed(database: string, indexedDB?: IDBFactory)".

* <a id="localIndexed.databases">localIndexed.databases(indexedDB?: IDBFactory): Promise\<IDBDatabaseInfo[]></a>
    * param `indexedDB: IDBFactory`: the indexedDB factory
    * return `Promise<IDBDatabaseInfo[]>`: result of database info

        ```typescript
        interface IDBDatabaseInfo {
            name?: string;
            version?: number;
        }
        ```

    Get database information from indexedDB factory

    ```javascript
    import localIndexed from "@focme/local-indexed"

    // upgrade database
    await localIndexed("database").upgrade()

    // get databases info
    const info = await localIndexed.databases()
    console.log(info) // [{ name: "database", version: 1 }]
    ```

* <a id="localIndexed.delete">localIndexed.delete(database: string, indexedDB?: IDBFactory): Promise\<boolean></a>
    * param `database: string`: database name
    * param `indexedDB: IDBFactory`: indexedDB factory
    * return `Promise<boolean>`: true if database does not exist

    Delete specified database.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    // upgrade database
    await localIndexed("database").upgrade()
    // delete database
    const bo = await localIndexed.delete("database") // true
    ```

    > `localIndexed.delete()` always return true as long as there is no exception.

* <a id="localIndexed.exists">localIndexed.exists(database: string, indexedDB?: IDBFactory): Promise\<boolean></a>
    * param `database: string`: database name
    * param `indexedDB: IDBFactory`: indexedDB factory
    * return `Promise<boolean>`: true if database exists

    Detemine if database exists.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    // upgrade database
    await localIndexed("database").upgrade()
    // detemine database exists
    const exists = await localIndexed.exists("database")
    console.log(exists) // true
    ```

* <a id="localIndexed.version">localIndexed.version(database: string, indexedDB?: IDBFactory): Promise\<number></a>
    * param `database: string`: database name
    * param `indexedDB: IDBFactory`: indexedDB factory
    * return `Promise<boolean>`: database version

    Get database version.

    > `localIndexed.version()` will return `0` if database does not exist.

    ```javascript
    import localIndexed from "@focme/local-indexed"
    // get database version
    const noneVersion = await localIndexed.version("database")
    console.log(noneVersion) // 0

    await localIndexed("database").upgrade()
    // get database version
    const version = await localIndexed.version("database")
    console.log(version) // 1
    ```

### localIndexed

* <a id="localIndexed">localIndexed(database: string, indexedDB?: IDBFactory): LDBIndexed</a>
    * param `database: string`: database name
    * param `indexedDB: IDBFactory`: indexedDB factory
    * return `LDBIndexed`: localIndexed object

    Create a `localIndex` object.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database") // localIndexed object
    ```

### <a id="LDBIndexed">LDBIndexed</a>

**attributes**

* <a id="LDBIndexed.name">LDBIndexed.name: string</a>

    Database name.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    // get database name
    console.log(indexed.name) // database
    ```

**detial apis**

* <a id="LDBIndexed.version">LDBIndexed.version(): Promise\<number></a>
    * return `Promise<number>`: database version

    Get database version.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    // upgrade database
    await indexed.upgrade()
    // get database version
    const version = await indexed.version()
    console.log(version) // 1
    ```

* <a id="LDBIndexed.stores">LDBIndexed.stores(): Promise\<string[]></a>
    * return `Promise<string[]>`: store names

    Get database store names.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    // upgrade database
    const store = indexed.collection("store")
    await indexed.upgrade(() => {
        store.create()
    })
    // get database store names
    const stores = await indexed.stores()
    console.log(stores) // ["store"]
    ```

**transaction apis**

* <a id="LDBIndexed.upgrade">LDBIndexed.upgrade(callback?: (event: LDBUpgradeEvent) => void | Promise\<void>): Promise\<void></a>
    * param `callback: (event: LDBUpgradeEvent) => void | Promise\<void>`: upgrade callback
    * type `LDBUpgradeEvent: { oldVersion: number, newVersion?: number }`: upgrade version info

    Upgrade databse.

    The `version` parameter can be ignore as `LDBIndexed.upgrade` can obtain the current database version and upgrade it to the next.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    const startVersion = await indexed.version()
    console.log(startVersion) // 0
    // upgrade version 0 to 1
    await indexed.upgrade()
    // upgrade version 1 to 2
    await indexed.upgrade()
    const version = await indexed.version()
    console.log(version) // 1

    // upgrade database from 2 to 3
    await indexed.upgrade((event) => {
        console.log(event.oldVersion) // 2
        console.log(event.newVersion) // 3
        // create store
        store.create()
    })

    // upgrade database from 3 to 4
    await indexed.upgrade(async (event) => {
        console.log(event.oldVersion) // 3
        console.log(event.newVersion) // 4
        // insert values
        await store.insert([...])
    })

    const endVersion = await indexed.version()
    console.log(endVersion) // 4
    ```

    In most cases you don't need to pay special attention to the version parameter,
    unless you need a full control of the upgradation

    > `LDBUpgradeEvent` is not a `Event`.

* <a id="LDBIndexed.upgrade2">LDBIndexed.upgrade(version: number, callback?: (event: LDBUpgradeEvent) => void | Promise\<void>): Promise\<void></a>
    * param `version: number`: new version to upgrade
    * param `callback: (event: LDBUpgradeEvent) => void | Promise\<void>`: upgrade callback
    * type `LDBUpgradeEvent: { oldVersion: number, newVersion?: number }`: upgrade version info

    Upgrade database to the specified version.

    The new version number must be bigger than the old version number.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")

    await indexed.upgrade() // upgrade to version 1
    await indexed.upgrade(1) // throw error
    await indexed.upgrade(5) // correct

    const version = await indexed.version()
    console.log(version) // 5
    ```

    All of collection apis can be used in `LDBIndexed.upgrade()` callback function. Such as:

    1. Create stores indexes or insert values.

        ```javascript
        import localIndexed from "@focme/local-indexed"

        const indexed = localIndexed("database")
        const classes = indexed.collection("classes")
        const classmates = indexed.collection("classmates")

        // version 1
        await indexed.upgrade(async () => {
            // create store
            classes.create({ keyPath: "id" })
            classmates.create({ keyPath: "id" })

            // create index
            classes.createIndex("grade")
            classmates.createIndex("age")
            classmates.createIndex("birth")

            // insert values
            await classes.insert([...])
            await classmates.insert([...])
        })
        ```

    2. Alter table or update values.

        ```javascript
        import localIndexed from "@focme/local-indexed"

        const indexed = localIndexed("database")
        const classes = indexed.collection("classes")
        const classmates = indexed.collection("classmates")

        // version 1
        await indexed.upgrade(() => {
            // create store
            classes.create()
            classmates.create()
        })

        // version 2
        await indexed.upgrade(async () => {
            // get all values
            const classesList = await classes.find()
            const classmatesList = await classmates.find()

            // alter store
            classes.alter({
                keyPath: "grade",
                autoIncrement: true,
                indexes: {
                    grade: { unique: false }
                }
            })
            classmates.alter({
                keyPath: "id",
                autoIncrement: true,
                indexes: {
                    age: { unique: false },
                    birth: { unique: false }
                }
            })

            // update values
            await classes.insert(classesList.map(() => ({})))
            await classmates.insert(classmatesList.map(() => ({})))
        })
        ```

    3. And create cursor.

        ```javascript
        import localIndexed from "@focme/local-indexed"

        const indexed = localIndexed("database")
        const classmates = indexed.collection("classmates")

        // version 1
        await indexed.upgrade(() => {
            // create store
            classmates.create()
        })

        // version 2
        await indexed.upgrade(async () => {
            const cursor = classmates.find(() => true)
            // update values
            await cursor.update(item => ({}))
        })
        ```

    Collection upgrade apis can only be used in `LDBIndexed.upgrade()` callback function, such as:
    * `LDBCollection\<T>.create` 
    * `LDBCollection\<T>.drop` 
    * `LDBCollection\<T>.alter`  
    * `LDBCollection\<T>.createIndex` 
    * `LDBCollection\<T>.dropIndex`

    These apis require transaction mode `versionchange` so they cannot be used in other situations.

    Use `LDBIndexed.abort()` rollback upgrade.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")

    // version 1 - 3
    await indexed.upgrade()
    await indexed.upgrade()
    await indexed.upgrade()
    // version 4
    await indexed.upgrade((event) => {
        console.log(event.oldVersion) // 3
        console.log(event.newVersion) // 4
        // rollback
        indexed.abort()
    })
    const version = await indexed.version()
    console.log(version) // 3
    ```

* <a id="LDBIndexed.transaction">LDBIndexed.transaction(callback?: () => void | Promise\<void>): Promise\<void></a>
    * param `callback: () => void | Promise<void>`: transaction callback

    Create a transaction.

    Collection apis can be used in `LDBIndexed.transaction()` callback function except upgrade apis.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const classmates = indexed.collection("classmates")

    // version 1
    await indexed.upgrade(() => {
        // create store
        classmates.alter({ keyPath: "id", autoIncrement: true })
    })

    await indexed.transaction(async () => {
        // insert update values
        await classmates.insert({ ... })
        await classmates.update([...])
        // delete values
        await classmates.remove([...])
        // get values
        const list = await classmates.find()
        // create cursor
        const cursor = classmates.find(() => true)
    })
    ```

    **The transaction callback will throw exception if there are no stores in database。**

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const stores = await indexed.stores()
    console.log(stores) // []

    // got error
    await indexed.transaction(() => {
        console.log(1) // will not log
        throw new Error() // will not throw
    })
    ```

    Use `LDBIndexed.abort()` rollback `LDBIndexed.transaction()`.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const classmates = indexed.collection("classmates")

    await indexed.upgrade(async () => {
        classmates.create({ keyPath: "id", autoIncrement: true })
        await classmates.insert([
            { name: "John", grade: 1, birth: new Date("2000/01/05") },
            { name: "Anny", grade: 1, birth: new Date("2000/04/17") },
        ])
    })

    await indexed.transaction(async () => {
        // delete classmates
        const cursor = classmates.find(() => true)
        await cursor.remove()

        // check delete
        const list = await classmates.find() // []
        console.log(list.length) // 0
        // rollback
        indexed.abort()
    })
    const list = await classmates.find() // [...]
    console.log(list.length) // 2
    ```

* <a id="LDBIndexed.abort">LDBIndexed.abort(): void</a>

    Abort current transaction.

    `LDBIndexed.upgrade()` is essentially a transaction that supports rollback operations.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(async () => {
        store.create()
    })

    await indexed.upgrade(async () => {
        try {
            ...
        } catch (error) {
            // rollback upgrade
            indexed.abort()
        }
    })

    await indexed.transaction(async () => {
        try {
            ...
        } catch (error) {
            // rollback transaction
            indexed.abort()
        }
    })
    ```

    **`LDBIndexed.abort()` could only be used in `LDBIndexed.upgrade()` or  `LDBIndexed.transaction()` callback function,**
    **in other situations use `LDBIndexed.abort()` will throw an exception.**

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    indexed.abort() // throw Error
    ```

* <a id="LDBIndexed.close">LDBIndexed.close(): void</a>

    Close database connection.

    Actually most of the apis could close the database connection automatically, unless there are unexpected circumstances.

**collection apis**

* <a id="LDBIndexed.collection">LDBIndexed.collection\<T>(store: string): LDBCollection\<T></a>
    * param `store: string`: store name
    * return `LDBCollection<T>`: collection object

    Create a collection.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    // create collection
    const store = indexed.collection("store")
    ```

### <a id="LDBCollection">LDBCollection\<T></a>

Use <a href="#LDBIndexed.collection">LDBIndexed.collection\<T>(store: string): LDBCollection\<T></a> create a collection object.

The generic type `T` should extends object but the default value is any.

```typescript
import localIndexed from "@focme/local-indexed"

type Store = { id: number, name: string }

const indexed = localIndexed("database")

const anyStore = indexed.collection("store") // LDBCollection<any>
const typedStore = indexed.collection<Store>("store") // LDBCollection<Store>
```

> Actually the `any` type value cannot be inserted into object store even though `IDBObjectStore.add(value: any, key?: IDBValidKey)` and `IDBObjectStore.put(value: any, key?: IDBValidKey)` both specify the `value` parameter type as any.

> **Pay special attention to the fact that most collection apis will try to open a database connection.**
> **If the current database does not exist, they will try to create one.**
> **This may cause unexpected database versions that do not meet expectations.**

**detial apis**

* <a id="LDBCollection.info">LDBCollection\<T>.info(): Promise\<LDBStoreInfo></a>
    * return `Promise<LDBStoreInfo>`: collection detials

        ```typescript
        // index info
        type LDBIndexInfo = {
            name: string
            keyPath: string | string[]
            unique: boolean
            multiEntry: boolean
        }

        // store info
        type LDBStoreInfo = {
            name: string
            keyPath: string | string[] | null
            autoIncrement: boolean
            indexes: Record<string, LDBIndexInfo>
        }
        ```

    Get collection detials.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    await indexed.upgrade(() => {
        store.create({ keyPath: "id", autoIncrement: false })
        store.createIndex("index_name", { keyPath: "name", unique: false })
        store.createIndex("index_number", { keyPath: "number", unique: true })
    })
    const info = await store.info()
    console.log(info.name) // "store"
    console.log(info.keyPath) // "id"
    console.log(info.autoIncrement) // false
    console.log(info.indexes) // { index_name: {...}, index_number: {...} }
    console.log(info.indexes["index_name"].name) // "index_name"
    console.log(info.indexes["index_name"].keyPath) // "name"
    console.log(info.indexes["index_name"].unique) // false
    console.log(info.indexes["index_name"].multiEntry) // false
    console.log(info.indexes["index_number"].name) // "index_number"
    console.log(info.indexes["index_number"].keyPath) // "number"
    console.log(info.indexes["index_number"].unique) // true
    console.log(info.indexes["index_number"].multiEntry) // false
    ```

* <a id="LDBCollection.exists">LDBCollection\<T>.exists(): Promise\<boolean></a>
    * return `Promise<boolean>`: true if store exists

    Detemine store exist or not.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    console.log(await store.exists()) // false

    // version 1
    await indexed.upgrade(() => {
        store.create()
    })
    console.log(await store.exists()) // true
    ```

**upgrade apis**

These apis can only be used in `LDBIndexed.upgrade` callback function.

* <a id="LDBCollection.create">LDBCollection\<T>.create(option?: LDBStoreOption): boolean</a>
    * param `option: LDBStoreOption`: create store option
    * return `boolean`: true if store exists

        ```typescript
        // create store index option
        type LDBIndexOption = {
            keyPath?: string | Iterable<string>
            unique?: boolean
            multiEntry?: boolean
        }

        // create store option
        type LDBStoreOption = {
            keyPath?: string | string[] | null
            autoIncrement?: boolean
            indexes?: Record<string, LDBIndexOption>
        }
        ```

    Create object store.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    await indexed.upgrade(() => {
        // create store
        const bo = store.create({
            keyPath: "id",
            autoIncrement: false,
            // create index
            indexes: {
                key1: { keyPath: "key1", unique: true },
                key2: { keyPath: "key2", unique: false }
            }
        })
        console.log(bo) // true
    })
    const stores = await indexed.stores() // ["store"]
    ```

    Stores cannot have the same name so that creating an existing store will throw an exception.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    await indexed.upgrade(() => {
        // create store
        store.create()
        store.create() // throw error
    })
    ```

* <a id="LDBCollection.drop">LDBCollection\<T>.drop(): boolean</a>
    * return `boolean`: true if store does not exist

    Delete store object.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create()
    })
    const stores = await indexed.stores()
    console.log(stores) // ["store"]

    // version 2
    await indexed.upgrade(() => {
        // delete store
        store.drop() // true
    })
    const noStores = await indexed.stores()
    console.log(noStores) // []
    ```

    Cannot delete a non-existent store.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // delete store
        store.drop() // throw error
    })
    ```

* <a id="LDBCollection.alter">LDBCollection\<T>.alter(option?: LDBStoreOption): boolean</a>
    * param `option: LDBStoreOption`: create store option
    * return `boolean`: true if store exists

        ```typescript
        // create store index option
        type LDBIndexOption = {
            keyPath?: string | Iterable<string>
            unique?: boolean
            multiEntry?: boolean
        }

        // create store option
        type LDBStoreOption = {
            keyPath?: string | string[] | null
            autoIncrement?: boolean
            indexes?: Record<string, LDBIndexOption>
        }
        ```

    Alter object store.

    `LDBCollection.alter()` will recreate the object store after delete it so you need to back up the data before calling it.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(async () => {
        // create store
        store.create()
        // insert values
        await store.insert([...])
    })

    // version 2
    await indexed.upgrade(async () => {
        // get all data
        const storeList = await store.find()
        // alter store
        store.alter()
        // update data if needed
        await store.insert(storeList.map(item => { ... }))
    })
    ```

* <a id="LDBCollection.createIndex">LDBCollection\<T>.createIndex(name: string, option?: LDBIndexOption): boolean</a>
    * param `name: string`: index name
    * param `option: LDBIndexOption`: create index option
    * return `boolean`: true if index exists

        ```typescript
        // create store index option
        type LDBIndexOption = {
            keyPath?: string | Iterable<string>
            unique?: boolean
            multiEntry?: boolean
        }
        ```

    Create object store index.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create()
        // create index
        const bo = store.createIndex("key1", { keyPath: "key1", unique: false })
        console.log(bo) // true
    })
    const info = await store.info()
    console.log(info.indexes["key1"].name) // "key1"
    console.log(info.indexes["key1"].keyPath) // "key1"
    console.log(info.indexes["key1"].unique) // false
    console.log(info.indexes["key1"].multiEntry) // false
    ```

* <a id="LDBCollection.dropIndex">LDBCollection\<T>.dropIndex(name: string): boolean</a>
    * param `name: string`: index name
    * return `boolean`: true if index does not exist

    Delete object store index.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create()
        // create index
        const bo = store.createIndex("key1", { keyPath: "key1", unique: false })
        console.log(bo) // true
    })

    // version 2
    await indexed.upgrade(() => {
        const bo = store.dropIndex("key1")
        console.log(bo) // true
    })
    const info = await store.info()
    console.log(info.indexes) // {}
    ```

**collection apis**

* <a id="LDBCollection.insert">LDBCollection\<T>.insert\<K extends IDBValidKey>(value: any): Promise\<K></a>
    * param `value: any`: insert value
    * return `Promise<K>`: key

    Insert value into object store.

    Type of the inserted value should extend `object` as something like number cannot be inserted into object store.

    `LDBCollection.insert()` returns the key of the newly inserted row.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
    })

    // insert value
    const id = await store.insert({ name: "name1", type: "type1" })
    console.log(id) // 1
    const list = await store.find()
    console.log(list) // [{ id: 1, name: "name1", type: "type1" }]
    ```

    Inserting an existing key will throw an exception.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
    })

    // insert value
    const id = await store.insert({ name: "name1", type: "type1" })
    console.log(id) // 1
    const list = await store.find()
    console.log(list) // [{ id: 1, name: "name1", type: "type1" }]

    // insert value
    const insertId = await store.insert({ id: 1, name: "name1", type: "type1" }) // throw error
    ```

* <a id="LDBCollection.insert2">LDBCollection\<T>.insert\<K extends IDBValidKey>(values: any[]): Promise\<K[]></a>
    * param `values: any[]`: insert values
    * return `Promise<K[]>`: keys

    Knsert values into object store.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
    })

    // insert values
    const ids = await store.insert([
        { name: "name1", type: "type1" },
        { name: "name2", type: "type2" }
    ])
    console.log(ids) // [1, 2]
    const list = await store.find()
    console.log(list.length) // 2
    console.log(list[0]) // { id: 1, name: "name1", type: "type1" }
    console.log(list[1]) // { id: 2, name: "name2", type: "type2" }
    ```

* <a id="LDBCollection.update">LDBCollection\<T>.update\<K extends IDBValidKey>(value: any): Promise\<K></a>
    * params `value: any`: update value
    * return `Promise<K>`: key

    Update value by key.

    The updated value should contain the `keyPath` field.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
    })

    // insert value
    const id = await store.insert({ name: "name1", type: "type1" })
    console.log(id) // 1
    const list = await store.find()
    console.log(list) // [{ id: 1, name: "name1", type: "type1" }]

    // update value
    const updateId = await store.update({ id: 1, name: "name2", type: "type2" })
    console.log(updateId) // 1
    const updateList = await store.find()
    console.log(updateList) // [{ id: 1, name: "name2", type: "type2" }]
    ```

    And `LDBCollection.update()` will insert a new data
    if the specified key does not exist in object store.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
    })

    // insert value
    const id = await store.insert({ name: "name1", type: "type1" })
    console.log(id) // 1
    const list = await store.find()
    console.log(list) // [{ id: 1, name: "name1", type: "type1" }]

    // update value
    const updateId = await store.update({ id: 2, name: "name2", type: "type2" })
    console.log(updateId) // 2
    const updateList = await store.find()
    console.log(updateList.length) // 2
    console.log(updateList[0]) // { id: 1, name: "name1", type: "type1" }
    console.log(updateList[1]) // { id: 2, name: "name2", type: "type2" }
    ```

* <a id="LDBCollection.update2">LDBCollection\<T>.update\<K extends IDBValidKey>(values: any[]): Promise\<K[]></a>
    * param `values: any[]`: update values
    * return `Promise<K[]>`: keys

    Update values by keys.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
    })

    // insert values
    const ids = await store.insert([
        { name: "name1", type: "type1" },
        { name: "name2", type: "type2" }
    ])
    console.log(ids) // [1, 2]
    const list = await store.find()
    console.log(list.length) // 2
    console.log(list[0]) // { id: 1, name: "name1", type: "type1" }
    console.log(list[1]) // { id: 2, name: "name2", type: "type2" }

    // update values
    const updateIds = await store.update([
        { id: 1, name: "updateName1", type: "updateType1" },
        { id: 2, name: "updateName2", type: "updateType2" }
    ])
    console.log(updateIds) // [1, 2]
    const updateList = await store.find()
    console.log(updateList.length) // 2
    console.log(updateList[0]) // { id: 1, name: "updateName1", type: "updateType1" }
    console.log(updateList[1]) // { id: 2, name: "updateName2", type: "updateType2" }
    ```

* <a id="LDBCollection.remove">LDBCollection\<T>.remove(key: IDBValidKey): Promise\<void></a>
    * param `key: IDBValidKey`: key

    Delete value by key.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
    })

    // insert value
    const id = await store.insert({ name: "name1", type: "type1" })
    console.log(id) // 1
    const list = await store.find()
    console.log(list) // [{ id: 1, name: "name1", type: "type1" }]

    // delete value
    await store.remove(1) // undefined
    const updateList = await store.find()
    console.log(updateList.length) // 0
    ```

* <a id="LDBCollection.remove2">LDBCollection\<T>.remove(keys: IDBValidKey[]): Promise\<void></a>
    * param `keys: IDBValidKey[]`: keys

    Delete values by keys.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
    })

    // insert values
    const ids = await store.insert([
        { name: "name1", type: "type1" },
        { name: "name2", type: "type2" }
    ])
    console.log(ids) // [1, 2]
    const list = await store.find()
    console.log(list.length) // 2
    console.log(list[0]) // { id: 1, name: "name1", type: "type1" }
    console.log(list[1]) // { id: 2, name: "name2", type: "type2" }

    // delete values
    await store.remove([1, 2]) // undefined
    const updateList = await store.find()
    console.log(updateList.length) // 0
    ```

* <a id="LDBCollection.remove3">LDBCollection\<T>.remove(keyRange: IDBKeyRange): Promise\<void></a>
    * param `keyRange: IDBKeyRange`: key range

    Delete values by key range.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
    })

    // insert values
    const ids = await store.insert([
        { name: "name1", type: "type1" },
        { name: "name2", type: "type2" },
        { name: "name3", type: "type3" },
        { name: "name4", type: "type4" },
        { name: "name5", type: "type5" }
    ])
    console.log(ids) // [1, 2, 3, 4, 5]
    const list = await store.find()
    console.log(list.length) // 5

    // delete values
    await store.remove(IDBKeyRange.bound(1, 5))
    const updateList = await store.find()
    console.log(updateList.length) // 0
    ```

* <a id="LDBCollection.find">LDBCollection\<T>.find(): Promise\<T[]></a>
    * return `Promise<T[]>`: values

    Get all values.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
    })

    // insert values
    const ids = await store.insert([
        { name: "name1", type: "type1" },
        { name: "name2", type: "type2" },
        { name: "name3", type: "type3" },
        { name: "name4", type: "type4" },
        { name: "name5", type: "type5" }
    ])
    console.log(ids) // [1, 2, 3, 4, 5]

    // get all values
    const list = await store.find()
    console.log(list.length) // 5
    console.log(list[0]) // { id: 1, name: "name1", type: "type1" }
    console.log(list[1]) // { id: 2, name: "name2", type: "type2" }
    console.log(list[2]) // { id: 3, name: "name3", type: "type3" }
    console.log(list[3]) // { id: 4, name: "name4", type: "type4" }
    console.log(list[4]) // { id: 5, name: "name5", type: "type5" }
    ```

* <a id="LDBCollection.find2">LDBCollection\<T>.find(key: IDBValidKey | IDBKeyRange, count?: number): Promise\<T[]></a>
    * param `key: IDBValidKey | IDBKeyRange`: key or key range
    * param `count: number`: quantity limit
    * return `Promise<T[]>`: values

    Get values by key.

    if `autoIncrement` set to `true` there will be only one value

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
    })

    // insert values
    const ids = await store.insert([
        { name: "name1", type: "type1" },
        { name: "name2", type: "type2" },
        { name: "name3", type: "type3" },
        { name: "name4", type: "type4" },
        { name: "name5", type: "type5" }
    ])
    console.log(ids) // [1, 2, 3, 4, 5]

    // get values
    const list = await store.find(1)
    console.log(list.length) // 1
    console.log(list[0]) // { id: 1, name: "name1", type: "type1" }

    // with count
    const countList = await store.find(1, 10)
    console.log(countList.length) // 1
    console.log(countList[0]) // { id: 1, name: "name1", type: "type1" }
    ```

    Get values by key range.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
    })

    // insert values
    const ids = await store.insert([
        { name: "name1", type: "type1" },
        { name: "name2", type: "type2" },
        { name: "name3", type: "type3" },
        { name: "name4", type: "type4" },
        { name: "name5", type: "type5" }
    ])
    console.log(ids) // [1, 2, 3, 4, 5]

    // get values
    const list = await store.find(IDBKeyRange.bound(1, 5))
    console.log(list.length) // 5
    console.log(list[0]) // { id: 1, name: "name1", type: "type1" }
    console.log(list[1]) // { id: 2, name: "name2", type: "type2" }
    console.log(list[2]) // { id: 3, name: "name3", type: "type3" }
    console.log(list[3]) // { id: 4, name: "name4", type: "type4" }
    console.log(list[4]) // { id: 5, name: "name5", type: "type5" }

    // with count
    const countList = await store.find(IDBKeyRange.bound(1, 5), 2)
    console.log(countList.length) // 2
    console.log(list[0]) // { id: 1, name: "name1", type: "type1" }
    console.log(list[1]) // { id: 2, name: "name2", type: "type2" }
    ```

* <a id="LDBCollection.find3">LDBCollection\<T>.find(keys: IDBValidKey[]): Promise\<T[]></a>
    * param `keys: IDBValidKey[]`: keys
    * return `Promise<T[]>`: values

    Get value by keys.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
    })

    // insert values
    const ids = await store.insert([
        { name: "name1", type: "type1" },
        { name: "name2", type: "type2" },
        { name: "name3", type: "type3" },
        { name: "name4", type: "type4" },
        { name: "name5", type: "type5" }
    ])
    console.log(ids) // [1, 2, 3, 4, 5]

    // get all values
    const list = await store.find([1, 2, 3, 4, 5])
    console.log(list.length) // 5
    console.log(list[0]) // { id: 1, name: "name1", type: "type1" }
    console.log(list[1]) // { id: 2, name: "name2", type: "type2" }
    console.log(list[2]) // { id: 3, name: "name3", type: "type3" }
    console.log(list[3]) // { id: 4, name: "name4", type: "type4" }
    console.log(list[4]) // { id: 5, name: "name5", type: "type5" }

**cursor apis**

* <a id="LDBCollection.find4">LDBCollection\<T>.find(filter: (item: T) => boolean): LDBCursor\<T></a>
    * param `filter: (item: T) => boolean`: cursor filter
    * return `LDBCursor`: cursor object

    Create cursor object with a filter function.

    Just a simple way to use `LDBCollection<T>.find(option: LDBCollectionCursor<T>): LDBCursor<T>`

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    const cursor = store.find(() => true)
    // as same as
    // const cursor = store.find({ filter: () => true })
    ```

* <a id="LDBCollection.find5">LDBCollection\<T>.find(option: LDBCollectionCursor\<T>): LDBCursor\<T></a>
    * param `option: LDBCollectionCursor`: cursor option
    * return `LDBCursor`: cursor object

        ```typescript
        // cursor direction
        type IDBCursorDirection = "next" | "nextunique" | "prev" | "prevunique"

        // cursor option
        type LDBCollectionCursor<T> = {
            // cursor filter
            filter?: (item: T) => boolean
            // sort by
            sort?: string
            // order by
            order?: IDBCursorDirection
        }
        ```

    Create cursor object with open cursor option.

    The `option.filter` function is used to iterate over all values
    and you can use `() => true` to match all of them.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
    })

    // insert values
    const ids = await store.insert([
        { name: "name1", type: "type1" },
        { name: "name2", type: "type2" },
        { name: "name3", type: "type3" },
        { name: "name4", type: "type4" },
        { name: "name5", type: "type5" }
    ])
    console.log(ids) // [1, 2, 3, 4, 5]

    // get all values use cursor
    const cursor = store.find({ filter: () => true })
    const list = await cursor.toList()
    console.log(list.length) // 5
    console.log(list[0]) // { id: 1, name: "name1", type: "type1" }
    console.log(list[1]) // { id: 2, name: "name2", type: "type2" }
    console.log(list[2]) // { id: 3, name: "name3", type: "type3" }
    console.log(list[3]) // { id: 4, name: "name4", type: "type4" }
    console.log(list[4]) // { id: 5, name: "name5", type: "type5" }
    ```

    The `option.sort` parameter determines which index to use to create the cursor.

    `LDBCollection.find` will use object store to create the cursor
    if the index specified by `option.sort` does not exist or there is no such parameter.

    **Note that the values matched by cursors created using index and object store may be different.**

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
        // create index
        store.createIndex("type", { keyPath: "type", unique: false })
    })

    // insert values
    const ids = await store.insert([
        { name: "name1", type: "type1" },
        { name: "name2", type: "type2" },
        { name: "name3", type: "type3" },
        { name: "name4" },
        { name: "name5" }
    ])
    console.log(ids) // [1, 2, 3, 4, 5]

    // get all values use object store cursor
    const cursor = store.find({ filter: () => true })
    const list = await cursor.toList()
    console.log(list.length) // 5
    console.log(list[0]) // { id: 1, name: "name1", type: "type1" }
    console.log(list[1]) // { id: 2, name: "name2", type: "type2" }
    console.log(list[2]) // { id: 3, name: "name3", type: "type3" }
    console.log(list[3]) // { id: 4, name: "name4" }
    console.log(list[4]) // { id: 5, name: "name5" }

    // get all values use index cursor
    const indexCursor = store.find({ filter: () => true, sort: "type" })
    const indexList = await indexCursor.toList()
    console.log(indexList.length) // 3
    console.log(indexList[0]) // { id: 1, name: "name1", type: "type1" }
    console.log(indexList[1]) // { id: 2, name: "name2", type: "type2" }
    console.log(indexList[2]) // { id: 3, name: "name3", type: "type3" }
    ```

    The `option.direction` parameter determines the direction of the cursor traversal.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
        // create index
        store.createIndex("type", { keyPath: "type", unique: false })
    })

    // insert values
    const ids = await store.insert([
        { name: "name1", type: "type1" },
        { name: "name2", type: "type2" },
        { name: "name3", type: "type1" },
        { name: "name4", type: "type2" },
        { name: "name5", type: "type1" }
    ])
    console.log(ids) // [1, 2, 3, 4, 5]

    // get all values use object store cursor
    const cursor = store.find({ filter: () => true })
    const list = await cursor.toList()
    console.log(list.length) // 5
    console.log(list[0]) // { id: 1, name: "name1", type: "type1" }
    console.log(list[1]) // { id: 2, name: "name2", type: "type2" }
    console.log(list[2]) // { id: 3, name: "name3", type: "type1" }
    console.log(list[3]) // { id: 4, name: "name4", type: "type2" }
    console.log(list[4]) // { id: 5, name: "name5", type: "type1" }

    // get all values use object store cursor with direction prev
    const prevCursor = store.find({ filter: () => true, order: "prev" })
    const prevList = await prevCursor.toList()
    console.log(prevList.length) // 5
    console.log(prevList[0]) // { id: 5, name: "name5", type: "type1" }
    console.log(prevList[1]) // { id: 4, name: "name4", type: "type2" }
    console.log(prevList[2]) // { id: 3, name: "name3", type: "type1" }
    console.log(prevList[3]) // { id: 2, name: "name2", type: "type2" }
    console.log(prevList[4]) // { id: 1, name: "name1", type: "type1" }

    // get all values use index cursor
    const indexCursor = store.find({ filter: () => true, sort: "type" })
    const indexList = await indexCursor.toList()
    console.log(indexList.length) // 5
    console.log(indexList[0]) // { id: 1, name: "name1", type: "type1" }
    console.log(indexList[1]) // { id: 3, name: "name3", type: "type1" }
    console.log(indexList[2]) // { id: 5, name: "name5", type: "type1" }
    console.log(indexList[3]) // { id: 2, name: "name2", type: "type2" }
    console.log(indexList[4]) // { id: 4, name: "name4", type: "type2" }

    // get all values use index cursor with direction prev
    const indexPrevCursor = store.find({ filter: () => true, sort: "type", order: "prev" })
    const indexPrevList = await indexPrevCursor.toList()
    console.log(indexPrevList.length) // 5
    console.log(indexPrevList[0]) // { id: 4, name: "name4", type: "type2" }
    console.log(indexPrevList[1]) // { id: 2, name: "name2", type: "type2" }
    console.log(indexPrevList[2]) // { id: 5, name: "name5", type: "type1" }
    console.log(indexPrevList[3]) // { id: 3, name: "name3", type: "type1" }
    console.log(indexPrevList[4]) // { id: 1, name: "name1", type: "type1" }
    ```

### <a id="LDBCursor">LDBCursor\<T></a>

Use <a href="#LDBCollection.find5">LDBCollection\<T>.find(option: LDBCollectionCursor\<T>): LDBCursor\<T></a> create a cursor object.

* <a id="LDBCursor.update">LDBCursor\<T>.update\<K extends IDBValidKey>(formatter: (item: T) => any): Promise\<K[]></a>
    * param `formatter: (item: T) => any`: update formatter
    * return `Promise<K[]>`: keys

    Update values by cursor.

    The cursor will traverse the matching values and call the `formatter` function to determine whether to update the current value.

    The cursor will try to modify the current value when the `formatter` function returns non-undefined and non-null value.

    Try to return `object` type value to avoid exceptions.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
        // create index
        store.createIndex("type", { keyPath: "type", unique: false })
    })

    // insert values
    const insertIds = await store.insert([
        { name: "name1", type: "type1" },
        { name: "name2", type: "type2" },
        { name: "name3", type: "type1" },
        { name: "name4", type: "type2" },
        { name: "name5", type: "type1" }
    ])
    console.log(insertIds) // [1, 2, 3, 4, 5]

    // create cursor
    // cursor traverse three value
    const cursor = store.find(item => item.id < 4)
    // but only update two of them
    const updateIds = await cursor.update(item => {
        const { id } = item
        if (id < 3) {
            return { id, name: `updateName${id}`, type: `updateType${id}` }
        }
    })
    console.log(updateIds) // [1, 2]

    const list = await store.find()
    console.log(list.length) // 5
    console.log(list[0]) // { id: 1, name: "updateName1", type: "updateType1" }
    console.log(list[1]) // { id: 2, name: "updateName2", type: "updateType2" }
    console.log(list[2]) // { id: 3, name: "name3", type: "type1" }
    console.log(list[3]) // { id: 4, name: "name4", type: "type2" }
    console.log(list[4]) // { id: 5, name: "name5", type: "type1" }
    ```

    Return `true` in `formatter` function can stop the cursor traversal.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
        // create index
        store.createIndex("type", { keyPath: "type", unique: false })
    })

    // insert values
    const insertIds = await store.insert([
        { name: "name1", type: "type1" },
        { name: "name2", type: "type2" },
        { name: "name3", type: "type1" },
        { name: "name4", type: "type2" },
        { name: "name5", type: "type1" }
    ])
    console.log(insertIds) // [1, 2, 3, 4, 5]

    // create cursor
    // cursor traverse only two values while the formatter stopped traversal
    const cursor = store.find(item => item.id < 4)
    // but only update the first one
    const updateIds = await cursor.update(item => {
        if (item.id === 1) {
            return { id: 1, name: "updateName1", type: "updateType1" }
        } else {
            // stop the cursor traversal
            return true
        }
    })
    console.log(updateIds) // [1]

    const list = await store.find()
    console.log(list.length) // 5
    console.log(list[0]) // { id: 1, name: "updateName1", type: "updateType1" }
    console.log(list[1]) // { id: 2, name: "name2", type: "type2" }
    console.log(list[2]) // { id: 3, name: "name3", type: "type1" }
    console.log(list[3]) // { id: 4, name: "name4", type: "type2" }
    console.log(list[4]) // { id: 5, name: "name5", type: "type1" }
    ```

* <a id="LDBCursor.remove">LDBCursor\<T>.remove(): Promise\<number></a>
    * return `Promise<number>`: delete quantity number

    Delete values by cursor.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
        // create index
        store.createIndex("type", { keyPath: "type", unique: false })
    })

    // insert values
    const ids = await store.insert([
        { name: "name1", type: "type1" },
        { name: "name2", type: "type2" },
        { name: "name3", type: "type1" },
        { name: "name4", type: "type2" },
        { name: "name5", type: "type1" }
    ])
    console.log(ids) // [1, 2, 3, 4, 5]

    // create cursor
    const cursor = store.find(item => item.id < 4)
    // delete all
    const count = await cursor.remove()
    console.log(count) // 3

    const list = await store.find()
    console.log(list.length) // 2
    console.log(list[0]) // { id: 4, name: "name4", type: "type2" }
    console.log(list[1]) // { id: 5, name: "name5", type: "type1" }
    ```

    > `LDBCursor.delete` cannot be stoped

* <a id="LDBCursor.toList">LDBCursor\<T>.toList(limit?: number, skip?: number): Promise\<T[]></a>
    * param `limit: number`: limit quantity number
    * param `skip: number`: skip quantity number
    * return `Promise<T[]>`: values

    Get values by cursor.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
        // create index
        store.createIndex("type", { keyPath: "type", unique: false })
    })

    // insert values
    const ids = await store.insert([
        { name: "name1", type: "type1" },
        { name: "name2", type: "type2" },
        { name: "name3", type: "type1" },
        { name: "name4", type: "type2" },
        { name: "name5", type: "type1" },
        { name: "name6", type: "type2" },
        { name: "name7", type: "type1" },
        { name: "name8", type: "type2" },
        { name: "name8", type: "type1" },
        { name: "name10", type: "type2" }
    ])
    console.log(ids) // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

    const list = await store.find(() => true).toList()
    console.log(list.length) // 10
    console.log(list.map(item => item.id)) // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

    const list1 = await store.find(() => true).toList(5)
    console.log(list1.length) // 5
    console.log(list1.map(item => item.id)) // [1, 2, 3, 4, 5]

    const list2 = await store.find(() => true).toList(5, 3)
    console.log(list2.length) // 5
    console.log(list2.map(item => item.id)) // [4, 5, 6, 7, 8]

    const list3 = await store.find(item => item.type === "type1").toList()
    console.log(list3.length) // 5
    console.log(list3.map(item => item.id)) // [1, 3, 5, 7, 9]

    const list4 = await store.find(item => item.type === "type1").toList(3)
    console.log(list4.length) // 3
    console.log(list4.map(item => item.id)) // [1, 3, 5]

    const list5 = await store.find(item => item.type === "type1").toList(3, 2)
    console.log(list5.length) // 3
    console.log(list5.map(item => item.id)) // [5, 7, 9]
    ```

    > Cursor use event to traverse data in native javascript,
    > so this method is very inefficient when there is a lot of data.

* <a id="LDBCursor.count">LDBCursor\<T>.count(): Promise\<number></a>
    * return `Promise<number>`: values quantity number

    Count values by cursor.

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    // version 1
    await indexed.upgrade(() => {
        // create store
        store.create({ keyPath: "id", autoIncrement: true })
        // create index
        store.createIndex("type", { keyPath: "type", unique: false })
    })

    // insert values
    const ids = await store.insert([
        { name: "name1", type: "type1" },
        { name: "name2", type: "type2" },
        { name: "name3", type: "type1" },
        { name: "name4", type: "type2" },
        { name: "name5", type: "type1" }
    ])
    console.log(ids) // [1, 2, 3, 4, 5]

    // create cursor
    console.log(await store.find(() => true).count()) // 5
    console.log(await store.find(item => item.id === 1).count()) // 1
    console.log(await store.find(item => item.id < 5).count()) // 4
    ```