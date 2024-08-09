function getIndexedDB() {
    if (!globalThis || !globalThis.indexedDB) {
        throw new ReferenceError("indexedDB is not defined")
    }
    return globalThis.indexedDB
}

export { getIndexedDB }