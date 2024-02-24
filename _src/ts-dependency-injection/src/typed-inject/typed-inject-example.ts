import { createInjector } from 'typed-inject'

import { getPlaceholderForRealDB, Database } from '../common'

export class Repository {
    constructor(private db: Database) {
    }
    public static inject = ['database'] as const

    get(id: number): any {
        return this.db.query(`SELECT * FROM tableA WHERE id = ${id}}`)[0]
    }
}

export class Service {
    constructor(private repository: Repository) {
    }
    public static inject = ['repository'] as const

    get(id: number): any {
        return this.repository.get(id)
    }
}

export const appInjector = createInjector()
    .provideFactory('database', () => getPlaceholderForRealDB())
    .provideClass('repository', Repository)
    .provideClass('service', Service)
