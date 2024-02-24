import { memoize } from 'lodash'
import { getPlaceholderForRealDB, Database } from '../common'

export class Repository {
    constructor(private db: Database) {
    }

    get(id: string): any {
        return this.db.query(`SELECT * FROM tableA WHERE id = ${id}}`)
    }
}

export class Service {
    constructor(private repository: Repository) {
    }

    get(id: string): any {
        return this.repository.get(id)
    }
}

export const dependencies = {
    getDb: memoize(() => getPlaceholderForRealDB()),
    getRepository: memoize(() => new Repository(dependencies.getDb())),
    getService: memoize(() => new Service(dependencies.getRepository())),
}
