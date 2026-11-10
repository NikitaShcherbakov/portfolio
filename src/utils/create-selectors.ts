import type { StoreApi, UseBoundStore } from 'zustand';

type Selectors<State> = { [Key in keyof State]: () => State[Key] };

type WithSelectors<Store> = Store extends { getState: () => infer State }
  ? Store & { use: Selectors<State> }
  : never;

export function createSelectors<Store extends UseBoundStore<StoreApi<object>>>(
  store: Store
) {
  const storeWithSelectors = store as WithSelectors<Store>;
  const selectors: Record<string, () => unknown> = {};

  for (const key of Object.keys(store.getState())) {
    selectors[key] = () =>
      store((state) => (state as Record<string, unknown>)[key]);
  }

  storeWithSelectors.use = selectors;

  return storeWithSelectors;
}
