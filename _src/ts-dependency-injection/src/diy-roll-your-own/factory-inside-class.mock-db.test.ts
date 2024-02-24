import { dependencies, Service } from './factory-inside-class'

describe('No-framework approach to managing dependencies (mocking DB)', () => {
    it('should allow mocking of the Database', () => {
        // spyOn(dependencies, 'getDb') is type-safe
        jest.spyOn(dependencies, 'getDb').mockReturnValue({
            query: () => [{ id: 2, name: 'mocked' }],
        })

        const serviceInstance = Service.getInstance()
        expect(serviceInstance.get(1)).toEqual({ id: 2, name: 'mocked' })
    })
})
