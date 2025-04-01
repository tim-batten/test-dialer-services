export function mergeObjects(objA: any, objB: any) {
    if (!objA) {
        return objB
    }
    if (!objB) {
        return objA
    }
    const toReturn: any = {}
    Object.keys({ ...objA, ...objB }).forEach((key) => {
        toReturn[key] = objB[key] || objA[key]
    })
    return toReturn
}

export function caseInsensitiveGetValue(obj: any, key: string) {
    const keyLower = key.toLowerCase()
    const result = Object.entries(obj).find((entry) => entry[0].toLowerCase() === keyLower)
    return result ? result[1] : undefined
}

export function forceArray<T>(entity: T | T [] | undefined): T[] {
    if (!entity) {
        return [] as T[]
    }
    if (Array.isArray(entity)) {
        return entity
    }
    return [ entity ]
}

export function distributeArray<T>(array: T[], chunkSize: number) {
    chunkSize = Math.ceil(Math.max(1, chunkSize))
    const toReturn: T[][] = []
    array.forEach((element, index) => {
        const destIdx = index % chunkSize
        if (!toReturn[destIdx]) {
            toReturn[destIdx] = []
        }
        toReturn[destIdx].push(element)
    })
    return toReturn
}