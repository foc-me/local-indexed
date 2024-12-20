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
    store.create({ keyPath: "id" })
    // create index
    store.createIndex("name", { unique: false })
    // init values
    await store.insert([
        { id: 1, ... },
        { id: 2, ... },
        ...
    ])
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
    await cursor.update(item => { ... }) // update values witch id larger than 20
    // delete values
    await cursor.remove() // delete values witch id larger than 20
})
```

# APIs

## static apis

* localIndexed.use(indexedDB: IDBFactory): void
    * param `indexedDB: IDBFactory`: the indexedDB factory

    set the global indexedDB factory that every database will use this global factory instead of the default

    ```javascript
    import { indexedDB } from "fake-indexeddb"
    import localIndexed from "@focme/local-indexed"

    // use fake-indexeddb instead of globalThis.indexedDB
    localIndexed.use(indexedDB)
    ```

    **a reference exception will be thrown if not set global factory and there is not a default factory**

* localIndexed.databases(): Promise\<IDBDatabaseInfo[]>
    * return `Promise<IDBDatabaseInfo[]>`: result of database info
    * type `IDBDatabaseInfo: { name?: string, version: number }`: database info

    get database info from indexedDB factory

    ```javascript
    import localIndexed from "@focme/local-indexed"

    // upgrade database
    await localIndexed("database").upgrade()

    // get databases info
    const info = await localIndexed.databases() // [{ name: "database", version: 1 }]
    ```

* localIndexed.delete(database: string, indexedDB?: IDBFactory): Promise\<boolean>
    * param `database: string`: database name
    * param `indexedDB: IDBFactory`: indexedDB factory
    * return `Promise<boolean>`: return true if database not exists

    delete specified database

    ```javascript
    import localIndexed from "@focme/local-indexed"

    // delete database
    const bo = await localIndexed.delete("database") // true
    ```

* localIndexed.exists(database: string, indexedDB?: IDBFactory): Promise\<boolean>
    * param `database: string`: database name
    * param `indexedDB: IDBFactory`: indexedDB factory
    * return `Promise<boolean>`: return true if database exists

    detemine if database exists

    ```javascript
    import localIndexed from "@focme/local-indexed"

    // upgrade database
    await localIndexed("database").upgrade()
    // detemine database exists
    const exists = await localIndexed.exists("database") // true
    ```

* localIndexed.version(database: string, indexedDB?: IDBFactory): Promise\<number>
    * param `database: string`: database name
    * param `indexedDB: IDBFactory`: indexedDB factory
    * return `Promise<boolean>`: database version

    get database version

    will return 0 if database not exists

    ```javascript
    import localIndexed from "@focme/local-indexed"

    await localIndexed("database").upgrade()
    // get database version
    const version = await localIndexed.version("database") // 1
    ```

## LDBIndexed

* localIndexed(database: string, indexedDB?: IDBFactory): LDBIndexed
    * param `database: string`: database name
    * param `indexedDB: IDBFactory`: indexedDB factory
    * return `LDBIndexed`: local indexed object

    create local indexed object

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database") // local indexed object
    ```

### attributes

* LDBIndexed.name: string

    database name

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    // get database name
    console.log(indexed.name) // database
    ```

### detial apis

* LDBIndexed.version(): Promise\<number>
    * return `Promise<number>`: database version

    get database version

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    // upgrade database
    await indexed.upgrade()
    // get database version
    const version = await indexed.version() // 1
    ```

* LDBIndexed.stores(): Promise\<string[]>
    * return `Promise<string[]>`: store names

    get database store names

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    // upgrade database
    const store = indexed.collection("store")
    await indexed.upgrade(() => {
        store.create()
    })
    // get database store names
    const stores = await indexed.stores() // ["store"]
    ```

### transaction apis

* LDBIndexed.upgrade(): Promise\<void>
    * return `Promise<void>`: promise void

    upgrade database

    use the current version upgrade the database to next version by step 1

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    // upgrade version 0 to 1
    await indexed.upgrade()
    // upgrade version 1 to 2
    await indexed.upgrade()
    const version = await indexed.version() // 1
    ```

* LDBIndexed.upgrade(callback: (event: LDBUpgradeEvent) => void | Promise\<void>): Promise\<void>
    * param `callback: (event: LDBUpgradeEvent) => void | Promise\<void>`: upgrade callback
    * type `LDBUpgradeEvent: { oldVersion: number, newVersion?: number }`: upgrade version info

    upgrade databse

    you can ignore the `version` parameter and upgrade will 
    use the current version upgrade the database to next version by step 1

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    // upgrade version 0 to 1
    await indexed.upgrade()
    // upgrade version 1 to 2
    await indexed.upgrade()
    const version = await indexed.version() // 1

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

    const version = await indexed.version() // 4
    ```

    **in most cases you don't need to pay special attention to the version parameter**
    **unless you need a full control of the upgradation**

* LDBIndexed.upgrade(version: number, callback?: (event: LDBUpgradeEvent) => void | Promise\<void>): Promise\<void>
    * param `version: number`: new version to upgrade
    * param `callback: (event: LDBUpgradeEvent) => void | Promise\<void>`: upgrade callback
    * type `LDBUpgradeEvent: { oldVersion: number, newVersion?: number }`: upgrade version info

    upgrade database to the specified version

    **note that the new version must bigger than the old version 
    or upgrade will throw an Error**

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    await store.upgrade() // upgrade to version 1

    await store.upgrade(1, () => {}) // throw error

    await store.upgrade(5, () => {}) // correct
    const version = await store.version() // 5
    ```

    **every collection api could work in upgrade callback function** 
    such as

    create stores indexes and insert values

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const classes = indexed.collection("classes")
    const classmates = indexed.collection("classmates")

    await store.upgrade(async () => {
        // create store
        classes.create({ keyPath: "id" })
        classmates.create({ keyPath: "id" })

        // create index
        classes.createIndex("grade")
        classmates.createIndex("age")
        classmates.createIndex("birth")

        // insert valeus
        await classes.insert([...])
        await classmates.insert([...])
    })
    ```

    alter table and update values

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const classes = indexed.collection("classes")
    const classmates = indexed.collection("classmates")

    await store.upgrade(async () => {
        // get all values
        const classesList = await classes.find()
        const classmatesList = await classmates.find()

        // alter store
        classes.alter({
            keyPath: "grade",
            autoIncreament: true,
            indexes: {
                "grade": { unique: false }
            }
        })
        classmates.alter({
            keyPath: "id",
            autoIncreament: true,
            indexes: {
                "age": { unique: false },
                "birth": { unique: false }
            }
        })

        // update value
        await classes.insert(classesList.map(item => { ... }))
        await classmates.insert(classmatesList.map(item => { ... }))
    })
    ```

    and use cursor

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const classmates = indexed.collection("classmates")

    await indexed.upgrade(async () => {
        const cursor = classmates.find(() => true)
        // update values
        await cursor.update(item => { ... })
    })
    ```

    **collection upgrade apis could only work in upgrade callback function** 
    such as 
    * `LDBCollection\<T>.create` 
    * `LDBCollection\<T>.drop` 
    * `LDBCollection\<T>.alter`  
    * `LDBCollection\<T>.createIndex` 
    * `LDBCollection\<T>.dropIndex`

    those apis need transaction mode `versionchange`

    at last **use LDBIndexed.abort could rollback upgrade**

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")

    await indexed.upgrade(async (event) => {
        console.log(event.oldVersion) // 3
        console.log(event.newVersion) // 4
        // rollback
        indexed.abort()
    })
    const version = await indexed.version() // 3
    ```

* LDBIndexed.transaction(callback?: () => void | Promise\<void>): Promise\<void>
    * param `callback: () => void | Promise<void>`: transaction callback

    create a transaction

    **collection apis could work in transaction callback function except upgrade apis**

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const classmates = indexed.collection("classmates")

    await store.transaction(async () => {
        // update values
        await classmates.update([...])
        await classmates.insert({ ... })

        // delete values
        await classmates.remove([...])

        // get values
        const list = await classmates.find()

        // use cursor
        const cursor = classmates.find(() => true)
    })
    ```

    **use LDBIndexed.abort rollback transaction**

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const classmates = indexed.collection("classmates")

    await indexed.upgrade(() => {
        classmates.create({ keyPath: "id", autoIncreament: true })
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

* LDBIndexed.abort(): void

    abort current transaction

    upgrade is essentially a transaction could be abort in action

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    const store = indexed.collection("store")

    await store.upgrade(async () => {
        try {
            ...
        } catch (error) {
            // rollback upgrade
            indexed.abort()
        }
    })

    await store.transaction(async () => {
        try {
            ...
        } catch (error) {
            // rollback transaction
            indexed.abort()
        }
    })
    ```

    **`LDBIndexed.abort` could only work in upgrade or transaction callback function**
    **or `LDBIndexed.abort` will throw an error**

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    indexed.abort() // throw Error
    ```

* LDBIndexed.close(): void

### collection apis

* LDBIndexed.collection\<T>(store: string): LDBCollection\<T>
    * param `store: string`: store name

    create a collection

    ```javascript
    import localIndexed from "@focme/local-indexed"

    const indexed = localIndexed("database")
    // create collection
    const store = indexed.collection("store")
    ```

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