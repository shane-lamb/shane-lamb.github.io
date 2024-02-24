import { mock } from 'jest-mock-extended'
import { getPlaceholderForRealDB, Database } from '../common'
import { appInjector, Repository, Service } from './typed-inject-example'
import { createInjector } from 'typed-inject'

describe('Dependency injection using typed-inject', () => {
    it('should not instantiate singletons more than once!', function() {
        const serviceInstance = appInjector.resolve('service')
        const dbInstance = appInjector.resolve('database')
        const repositoryInstance = appInjector.resolve('repository')

        // check that multiple calls to get instances return the same instance
        expect(serviceInstance).toBe(appInjector.resolve('service'))
        expect(dbInstance).toBe(appInjector.resolve('database'))
        expect(repositoryInstance).toBe(appInjector.resolve('repository'))
    })

    it('should use "real" instances when mocking is not employed', () => {
        const serviceInstance = appInjector.resolve('service')

        expect(serviceInstance.get(1)).toEqual({ id: 1, name: 'test' })
    })

    it('should allow mocking of the Database', () => {
        const mockDatabase = mock<Database>()
        mockDatabase.query.mockReturnValue([{ id: 2, name: 'mocked' }])

        const testInjector = createInjector()
            .provideFactory('database', () => mockDatabase)
            .provideClass('repository', Repository)
            .provideClass('service', Service)

        const serviceInstance = testInjector.resolve('service')
        expect(serviceInstance.get(1)).toEqual({ id: 2, name: 'mocked' })
    })

    it('should allowing mocking of the Repository', () => {
        const mockRepository = mock<Repository>()
        mockRepository.get.mockReturnValue({ id: 3, name: 'mocked' })

        const testInjector = createInjector()
            .provideFactory('database', () => getPlaceholderForRealDB())
            .provideFactory('repository', () => mockRepository)
            .provideClass('service', Service)

        const serviceInstance = testInjector.resolve('service')
        expect(serviceInstance.get(1)).toEqual({ id: 3, name: 'mocked' })
    })
})
