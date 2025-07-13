export interface Database {
    query(queryString: string): {[columnName: string]: any}[]
}

// let's pretend it's real!
// this illustrates use of a 3rd Party dependency where we don't define the class,
// or we can't instantiate it directly
export function getPlaceholderForRealDB(): Database {
    return {
        query(queryString: string) {
            return [{
                id: 1,
                name: 'test'
            }]
        }
    }
}

// an implementation of lodash's memoize that doesn't alter/pollute types
export function memoize<T>(factory: () => T): () => T {
    let cached: T
    return () => {
        if (cached === undefined) cached = factory()
        return cached
    }
}
