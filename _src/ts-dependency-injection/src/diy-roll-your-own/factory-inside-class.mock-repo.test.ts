import { Repository, Service } from './factory-inside-class'
import { mock } from 'jest-mock-extended'

describe('No-framework approach to managing dependencies (mocking repository)', () => {
    it('should allowing mocking of the Repository', () => {
        const mockRepository = mockInstance(Repository)
        mockRepository.get.mockReturnValue({ id: 3, name: 'mocked' })

        const serviceInstance = Service.getInstance()
        expect(serviceInstance.get(1)).toEqual({ id: 3, name: 'mocked' })
    })
})

// example of handy function to reduce boilerplate when mocking!
function mockInstance<T>(singleton: { getInstance: () => T }) {
    const thisMock = mock<T>()
    jest.spyOn(singleton, 'getInstance').mockReturnValue(thisMock)
    return thisMock
}
