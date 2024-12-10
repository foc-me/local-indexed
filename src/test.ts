import localIndexed from "./indexed"

const indexed = localIndexed("local-indexed")
await indexed.upgrade(() => {
    const user = indexed.storage("user-info")
    user.create()
    user.createIndex("sdf")
})