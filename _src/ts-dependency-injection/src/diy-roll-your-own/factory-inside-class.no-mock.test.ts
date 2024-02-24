import { dependencies, Repository, Service } from './factory-inside-class'

describe('No-framework approach to managing dependencies (no mocking)', () => {
    it('should not instantiate singletons more than once!', function() {
        const serviceInstance = Service.getInstance()
        const dbInstance = dependencies.getDb()
        const repositoryInstance = Repository.getInstance()

        // check that multiple calls to get instances return the same instance
        expect(serviceInstance).toBe(Service.getInstance())
        expect(dbInstance).toBe(dependencies.getDb())
        expect(repositoryInstance).toBe(Repository.getInstance())

        // inspect instance internals to check they don't have different instances
        expect((serviceInstance as any).repository).toBe(Repository.getInstance())
        expect((repositoryInstance as any).db).toBe(dependencies.getDb())
    })

    it('should use "real" instances when mocking is not employed', () => {
        const serviceInstance = Service.getInstance()

        expect(serviceInstance.get(1)).toEqual({ id: 1, name: 'test' })
    })
})
