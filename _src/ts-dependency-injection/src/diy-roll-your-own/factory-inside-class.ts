import { memoize } from 'lodash'
import { getPlaceholderForRealDB } from '../common'

export const dependencies = {
    // demonstrating that dependency resolvers can be nested to allow easy mocking
    // (when not using the class-based approach)
    getDb: memoize(() => getPlaceholderForRealDB()),
}

export class Repository {
    static readonly getInstance = memoize(() => new Repository())

    constructor(private db = dependencies.getDb()) {
    }

    get(id: number): any {
        return this.db.query(`SELECT * FROM tableA WHERE id = ${id}}`)[0]
    }
}

export class Service {
    static readonly getInstance = memoize(() => new Service())

    constructor(private repository = Repository.getInstance()) {
    }

    get(id: number): any {
        return this.repository.get(id)
    }
}
