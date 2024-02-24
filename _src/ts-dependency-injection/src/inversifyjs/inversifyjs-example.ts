import { Database, getPlaceholderForRealDB } from '../common'
import { injectable, inject, Container } from 'inversify'

@injectable()
export class Repository {
    // a bit of unsafe typing when using injection by token
    // - no guarantee that the dependency registered under the 'Database' token is actually of type Database
    // - no compile-time checking that the 'Database' token is registered (could be a misspelled)
    constructor(@inject('Database') private db: Database) {}

    get(id: number): any {
        return this.db.query(`SELECT * FROM tableA WHERE id = ${id}}`)[0]
    }
}

@injectable()
export class Service {
    // still possible to get runtime errors if the dependency is not registered/can't be resolved
    constructor(private repository: Repository) {}

    get(id: number): any {
        return this.repository.get(id)
    }
}

export const appContainer = new Container({ defaultScope: 'Singleton' })
appContainer.bind<Database>('Database').toDynamicValue(getPlaceholderForRealDB)
appContainer.bind(Repository).toSelf()
appContainer.bind(Service).toSelf()
