import { mock } from 'bun:test';

export const mockQueryResult: unknown[] = [];

let queryCallCount = 0;
const queryResults: Map<number, unknown[]> = new Map();

export function setQueryResult(callIndex: number, result: unknown[]) {
  queryResults.set(callIndex, result);
}

export function resetQueryCallCount() {
  queryCallCount = 0;
  queryResults.clear();
}

function createResolvedChain(result: unknown[]): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  const resolver = () => chain;
  chain.select = resolver;
  chain.from = resolver;
  chain.orderBy = resolver;
  chain.where = resolver;
  chain.limit = () => Promise.resolve(result);
  chain.then = (resolve: (value: unknown) => void) => Promise.resolve(result).then(resolve);
  chain.insert = () => ({
    values: () => ({
      returning: () => Promise.resolve([{ id: 'mock-id' }]),
      onConflictDoUpdate: () => Promise.resolve(),
    }),
  });
  return chain;
}

function createMockQueryChain() {
  return {
    select: () => {
      const index = queryCallCount++;
      const result = queryResults.get(index) ?? mockQueryResult;
      return createResolvedChain([...result]);
    },
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([{ id: 'mock-id' }]),
        onConflictDoUpdate: () => Promise.resolve(),
      }),
    }),
  };
}

export function setupDatabaseMock() {
  mock.module('@lesson-adapter/database', () => ({
    database: createMockQueryChain(),
    schema: {
      learningProfiles: { userId: 'userId' },
      adaptedLessons: { userId: 'userId', createdAt: 'createdAt', id: 'id' },
      adaptationReflections: { userId: 'userId', adaptedLessonId: 'adaptedLessonId' },
    },
  }));

  mock.module('drizzle-orm', () => ({
    eq: () => true,
    desc: () => true,
    and: () => true,
    inArray: () => true,
  }));
}
