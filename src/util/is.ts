type AsyncFunction = (...args: unknown[]) => Promise<unknown>

/**
 * get type string of target
 * 
 * @param target target
 * @returns type string
 */
function isTypeof(target: any): string {
    return Object.prototype.toString.call(target).slice(8, -1)
}

/**
 * determine target function is asynchronous
 * 
 * @param target target
 * @returns result
 */
function isAsyncFunction(target: any): target is AsyncFunction {
    return isTypeof(target) === "AsyncFunction"
}

export { isTypeof, isAsyncFunction }