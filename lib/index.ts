import { getIndexedDB } from "lib/indexed"

function createIndexed() {
    const db = getIndexedDB()
    return db
}

export default createIndexed