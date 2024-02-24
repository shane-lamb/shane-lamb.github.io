// need to import 'reflect-metadata' at the app entry point
import 'reflect-metadata'

import { container, inject, injectable, instanceCachingFactory, singleton } from 'tsyringe'
import { getPlaceholderForRealDB, Database } from '../common'

// decorators won't work on interfaces, or where we don't control the code of the class (as in 3rd party libraries)
container.register<Database>('Database', { useFactory: instanceCachingFactory(getPlaceholderForRealDB) })

@singleton()
export class Repository {
    // a bit of unsafe typing when using injection by token
    // - no guarantee that the dependency registered under the 'Database' token is actually of type Database
    // - no compile-time checking that the 'Database' token is registered (could be a misspelled)
    constructor(@inject('Database') private db: Database) {
    }

    get(id: number): any {
        return this.db.query(`SELECT * FROM tableA WHERE id = ${id}}`)[0]
    }
}

@singleton()
export class Service {
    // still possible to get runtime errors if the dependency is not registered/can't be resolved
    constructor(private repository: Repository) {
    }

    get(id: number): any {
        return this.repository.get(id)
    }
}
