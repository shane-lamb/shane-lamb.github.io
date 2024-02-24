import { Inject, Module } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { Database, getPlaceholderForRealDB } from '../common'

@Injectable()
export class Repository {
    // a bit of unsafe typing when using injection by token
    // - no guarantee that the dependency registered under the 'Database' token is actually of type Database
    // - no compile-time checking that the 'Database' token is registered (could be a misspelled)
    constructor(@Inject('Database') private db: Database) {}

    get(id: number): any {
        return this.db.query(`SELECT * FROM tableA WHERE id = ${id}}`)[0]
    }
}

@Injectable()
export class Service {
    // still possible to get runtime errors if the dependency is not registered/can't be resolved
    constructor(private repository: Repository) {}

    get(id: number): any {
        return this.repository.get(id)
    }
}

@Module({
    providers: [
        Service,
        Repository,
        {
            provide: 'Database',
            useFactory: getPlaceholderForRealDB,
        },
    ],
})
export class AppModule {}
