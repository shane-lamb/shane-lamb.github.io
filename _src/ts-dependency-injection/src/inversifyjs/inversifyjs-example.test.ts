// need to import 'reflect-metadata' at the tests entry point (in jest setup file)
import 'reflect-metadata'

import { mock } from 'jest-mock-extended'
import { Database } from '../common'
import { appContainer, Repository, Service } from './inversifyjs-example'

describe('Dependency injection using typed-inject', () => {
    it('should not instantiate singletons more than once!', function() {
        const serviceInstance = appContainer.get(Service)
        const dbInstance = appContainer.get<Database>('Database')
        const repositoryInstance = appContainer.get(Repository)

        // check that multiple calls to get instances return the same instance
        expect(serviceInstance).toBe(appContainer.get(Service))
        expect(dbInstance).toBe(appContainer.get<Database>('Database'))
        expect(repositoryInstance).toBe(appContainer.get(Repository))
    })

    it('should use "real" instances when mocking is not employed', () => {
        const serviceInstance = appContainer.get(Service)

        expect(serviceInstance.get(1)).toEqual({ id: 1, name: 'test' })
    })

    it('should allow mocking of the Database', () => {
        const mockDatabase = mock<Database>()
        mockDatabase.query.mockReturnValue([{ id: 2, name: 'mocked' }])

        appContainer.rebind<Database>('Database').toConstantValue(mockDatabase)

        const serviceInstance = appContainer.get(Service)
        expect(serviceInstance.get(1)).toEqual({ id: 2, name: 'mocked' })
    })

    it('should allowing mocking of the Repository', () => {
        const mockRepository = mock<Repository>()
        mockRepository.get.mockReturnValue({ id: 3, name: 'mocked' })

        appContainer.rebind(Repository).toConstantValue(mockRepository)

        const serviceInstance = appContainer.get(Service)
        expect(serviceInstance.get(1)).toEqual({ id: 3, name: 'mocked' })
    })
})
