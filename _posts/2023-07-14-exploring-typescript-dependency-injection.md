---
layout: post
title: Exploring dependency injection in TypeScript and Node.js
date: 2023-07-14
src_url: https://github.com/shane-lamb/shane-lamb.github.io/tree/main/_src/ts-dependency-injection/src
---

Herein lies an exploration of the current landscape of dependency injection solutions for Node.js based TypeScript applications.
Do you need a fancy framework, or can you manage on your own? By breaking down each option into a set of comparable features, an informed decision can be made.

Now for some context. Typically, an app is composed of many singleton services/repositories that reference each other.
Since they depend on each other, these components can be referred to as dependencies.
In the beginnings of app development, there are few classes and so dependencies are easy to deal with, no matter how badly organised the code is.
As the app grows and the dependency tree widens and deepens, it may be necessary to take a more strategic approach to manage these dependencies.

In dependency management, there are 2 broad goals:
- On app initialisation, to construct the dependency tree using code that is easily maintainable
- In testing, to make mocking of dependencies easy (at arbitrary depths of the tree)

To this end, there exist a number of libraries that provide dependency injection functionality.

## Feature matrix

|                               | [TSyringe](https://github.com/microsoft/tsyringe) | [InversifyJS](https://github.com/inversify/InversifyJS) | [Typed Inject](https://github.com/nicojs/typed-inject) | [nestjs](https://github.com/nestjs/nest) | DIY                                          |
|-------------------------------|---------------------------------------------------|---------------------------------------------------------|--------------------------------------------------------|------------------------------------------|----------------------------------------------|
| 1. Container based            | Yes                                               | Yes                                                     | Yes                                                    | Yes                                      | No                                           |
| 2. Easy mocking               | Yes                                               | Yes                                                     | No                                                     | Yes                                      | Yes                                          |
| 3. Uses decorators/reflection | Yes                                               | Yes                                                     | No                                                     | Yes                                      | No                                           |
| 4. Centralised registration   | No                                                | Yes                                                     | Yes                                                    | Yes                                      | No (or yes)                                  |
| 5. Type Safety                | Good                                              | Good                                                    | Best                                                   | Good                                     | Best                                         |                                                   
| 6. Possible runtime errors    | Yes                                               | Yes                                                     | No                                                     | Yes                                      | No                                           |
| 7. Feature bloat              | Low                                               | High                                                    | Low                                                    | Depends                                  | Low/None                                     |                                                    
| Code example                  | [here]({{ page.src_url }}/tsyringe)               | [here]({{ page.src_url }}/inversifyjs)                  | [here]({{ page.src_url }}/typed-inject)                | [here]({{ page.src_url }}/nestjs)        | [here]({{ page.src_url }}/diy-roll-your-own) |

Notes:
- [nestjs](https://github.com/nestjs/nest)
  - Bloat is moderately high if you're only using the DI features, but it's a full server-side app framework
- DIY
  - A "roll your own" approach. Using simple conventions instead of a framework
- Code examples
  - Each option has a short (and uniform) code example that shows basic usage, including from a testing perspective

### 1. Container based (vs monkey patching)
Traditionally, dependency injection has been container based.
Under this model, dependencies are registered to a container, which makes the container simply a bucket of dependencies.
To "resolve" or fetch the instance for a particular dependency, we simply query the container, giving a reference to the dependency's type.
The container can then construct the instance if not cached, or return a cached instance that has previously been instantiated.

The standout feature of this approach is that it allows the use of different containers for different purposes.
Typically, this means one container for real-world application use, and one or more containers for testing of the application, where we want to "mock" certain dependencies within a test context.

In traditional languages that are not as dynamic as JavaScript/TypeScript, this is clearly the most reasonable approach to enable mocking of dependencies that may be deeply nested within the class under test.
In TypesScript, using a framework such as `jest`, we have an alternative. As part of test setup, it is possible to override or "monkey patch" dependency resolvers with mock implementations.
Effectively, this enables mocking of dependencies within the scope of a single test file. Outside of the test file, other tests will be unaffected by the mocks, even when the tests are run in parallel.

The "DIY" approach is the only option that doesn't utilise a container, and therefore requires monkey patching for testing.

One might suppose that the monkey patching method is dirty and to be avoided. But with the right implementation, we get:
- Complete type safety, including in testing
- Convenient mocking
- Dependency resolution issues caught at compile-time
- Less indirection/abstraction in dependency instantiation than with alternatives

### 2. Easy mocking

This is referring to how easily a *nested* dependency can be mocked in a test context.

In a DI framework, we should be able to take the actual application container as a starting point,
and then derive a test container by mocking one or more arbitrary dependencies.

Using the DIY approach, we can use monkey patching which is functionally equivalent to this.

`typed-inject` is the only option not considered easy to mock, because the test container must be built from scratch,
without being able to reference the application container.

### 3. Uses decorators/reflection
Some libraries make use of decorators and reflection to automatically inject dependencies of the specified type.
This is a positive if it reduces boilerplate/increases readability, but a (small) negative in that it increases the complexity of building and bootstrapping an app.

As an example, when retrofitting an existing app, I encountered the following issues (which were not quick fixes):
- eslint throwing nonsense errors after introduction of decorators
- broken jest transpilation (had to switch from `@swc/jest` to `ts-jest` to fix it)

Also, since these features are still considered "experimental", there is the risk of the API contract breaking and causing incompatibilities with different versions of TypesScript.
Issues with incompatibility will probably be resolved by library maintainers, but still it's a potential pain point.

Overall, I'd recommend using decorators/reflection if the productivity benefits are non-trivial.

### 4. Centralised registration (of dependencies, vs decentralised or mixed)

This refers to whether all dependencies must be registered in a single location, or whether the registration can be combined with the definition of the dependency.

Decentralised registration has some advantages:
- One less place to make a change when adding a new dependency
- Less chance of merge conflicts

### 5. Type safety

All options provide some reasonable type safety and work well with TypeScript.
If there are some situations where it's possible to register or inject the wrong type of dependency, then the type safety is marked as "good".
If the type safety is water-tight, then it's marked as "best".

### 6. Possible runtime errors (vs compile-time errors)

When a required dependency hasn't been registered, or there are dependency resolution issues, will the error surface at compile time or runtime?
Compiler errors are more desirable as you get immediate feedback (red squiggly line in your IDE).
Runtime errors may surface in testing, or may be missed during development if unlucky/lacking tests!

### 7. Feature bloat

This aims to give an indication of how heavyweight or bloated with unnecessary features the library is.

## Explaining the DIY approach

Libraries provide a structure to manage dependencies, but there's nothing to stop us applying structure and convention to plain TypeScript code to achieve a similar result.
Here I present a simple DIY approach that should scale to the needs of any application.

Let's examine the code which is at the core of the solution: the definition of a class/service to be injected.

```typescript
import { memoize } from 'lodash'

export class Service {
  static readonly getInstance = memoize(() => new Service())

  constructor(private repository = Repository.getInstance()) {
  }

  doSomething() {
    this.repository.doSomething()
  }
}
```
- These should constitute the bulk of dependencies in your application: internal classes which need to be instantiated as a singleton instance
- The level of boilerplate is low
- In this example, we have a dependency on the commonly used `lodash` library which provides the `memoize()` method. The function is very simple, and could be replaced by a helper method in your application code. It simply caches the result of the function after the first invocation, which enables the singleton pattern for this class
- In the constructor, we can use the default parameters feature of TypeScript to "inject" dependencies in a manner that is syntactically similar to `private repository: Repository`
  - This enables functional equivalency to a library like `tsyringe` which uses reflection to detect the type of constructor parameters and inject accordingly
  - This is in the "decentralised registration" style and carries the benefits of that approach

Typically though, there are some dependencies that need a different style of registration, in cases where you don't control the class being injected.
These can be placed into a configuration file like so:

```typescript
export const dependencies = {
  getDb: memoize(() => new pg.Pool(dbConfig)),
}
```
- It's intentional that the `getDb` resolver is nested within an object (in this case named `dependencies`). This enables type-safe mocking using `jest.spyOn(dependencies, 'getDb')`. If `getDb` was exported at the top level of the file, you'd have to resort to loosely typed methods of mocking.

Now, we move on to the remaining points of how to bootstrap the application, and how to mock nested dependencies in testing!

### Bootstrapping the application

```typescript
const app = App.getInstance()
```

That's it! You can resolve the entry point to your application the same way that child dependencies are resolved.

### Testing and mocking

Type safety in mocking can be ensured by providing mock implementations using the `jest.spyOn()` method.
Additionally, I'd recommend using the `jest-mock-extended` library to generate type-safe mocks, so that you don't need to hand craft any mock instances!

```ts
import { mock } from 'jest-mock-extended'

const mockRepository = mock(Repository)
jest.spyOn(Repository, 'getInstance').mockReturnValue(mockRepository)

const app = App.getInstance() // app instance using the mock repository!

// test assertions here
```

As this is a common pattern for mocking, we could utilise a helper method to make things more compact:

```ts
function mockInstance<T>(singleton: { getInstance: () => T }) {
  const thisMock = mock<T>()
  jest.spyOn(singleton, 'getInstance').mockReturnValue(thisMock)
  return thisMock
}
```

Resulting in the test code looking like:

```ts
const mockRepository = mockInstance(Repository)

const app = App.getInstance() // app instance using the mock repository!

// test assertions here
```

## Conclusion

You can make your own conclusions, but my opinion is that the DIY option is best unless there's a good reason to use a framework.
I've found that even large and complex TypeScript apps are (or can be) essentially a collection of singleton services.
