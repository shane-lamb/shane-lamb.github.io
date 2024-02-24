// need to import 'reflect-metadata' at the tests entry point (in jest setup file)
import 'reflect-metadata'

import { mock } from 'jest-mock-extended'
import { container } from 'tsyringe'
import { Database } from '../common'
import { Repository, Service } from './tsyringe-example'

describe('Dependency injection using tsyringe', () => {
    it('should not instantiate singletons more than once!', function() {
        const serviceInstance = container.resolve(Service)
        const dbInstance = container.resolve('Database')
        const repositoryInstance = container.resolve(Repository)

        // check that multiple calls to get instances return the same instance
        expect(serviceInstance).toBe(container.resolve(Service))
        expect(dbInstance).toBe(container.resolve('Database'))
        expect(repositoryInstance).toBe(container.resolve(Repository))
    })

    it('should use "real" instances when mocking is not employed', () => {
        const serviceInstance = container.resolve(Service)

        expect(serviceInstance.get(1)).toEqual({ id: 1, name: 'test' })
    })

    it('should allow mocking of the Database', () => {
        const mockDatabase = mock<Database>()
        mockDatabase.query.mockReturnValue([{ id: 2, name: 'mocked' }])

        const testContainer = container.createChildContainer()
        testContainer.registerInstance('Database', mockDatabase)

        const serviceInstance = testContainer.resolve(Service)
        expect(serviceInstance.get(1)).toEqual({ id: 2, name: 'mocked' })
    })

    it('should allowing mocking of the Repository', () => {
        const mockRepository = mock<Repository>()
        mockRepository.get.mockReturnValue({ id: 3, name: 'mocked' })

        const testContainer = container.createChildContainer()
        testContainer.registerInstance(Repository, mockRepository)

        const serviceInstance = testContainer.resolve(Service)
        expect(serviceInstance.get(1)).toEqual({ id: 3, name: 'mocked' })
    })
})
