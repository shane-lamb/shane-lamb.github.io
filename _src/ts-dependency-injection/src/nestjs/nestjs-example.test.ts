// need to import 'reflect-metadata' at the tests entry point (in jest setup file)
import 'reflect-metadata'

import { Database } from '../common'
import { AppModule, Repository, Service } from './nestjs-example'
import { NestFactory } from '@nestjs/core'
import { mock } from 'jest-mock-extended'
import { Test } from '@nestjs/testing'

describe('Dependency injection using tsyringe', () => {
    it('should not instantiate singletons more than once!', async () => {
        const app = await NestFactory.createApplicationContext(AppModule)

        const serviceInstance = await app.resolve(Service)
        const dbInstance = await app.resolve('Database')
        const repositoryInstance = await app.resolve(Repository)

        // check that multiple calls to get instances return the same instance
        expect(serviceInstance).toBe(await app.resolve(Service))
        expect(dbInstance).toBe(await app.resolve('Database'))
        expect(repositoryInstance).toBe(await app.resolve(Repository))
    })

    it('should use "real" instances when mocking is not employed', async () => {
        const app = await NestFactory.createApplicationContext(AppModule)

        const serviceInstance = await app.resolve(Service)

        expect(serviceInstance.get(1)).toEqual({ id: 1, name: 'test' })
    })

    it('should allow mocking of the Database', async () => {
        const mockDatabase = mock<Database>()
        mockDatabase.query.mockReturnValue([{ id: 2, name: 'mocked' }])

        const testApp = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider('Database')
            .useValue(mockDatabase)
            .compile()

        const serviceInstance = await testApp.resolve(Service)
        expect(serviceInstance.get(1)).toEqual({ id: 2, name: 'mocked' })
    })

    it('should allowing mocking of the Repository', async () => {
        const mockRepository = mock<Repository>()
        mockRepository.get.mockReturnValue({ id: 3, name: 'mocked' })

        const testApp = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(Repository)
            .useValue(mockRepository)
            .compile()

        const serviceInstance = await testApp.resolve(Service)
        expect(serviceInstance.get(1)).toEqual({ id: 3, name: 'mocked' })
    })
})
