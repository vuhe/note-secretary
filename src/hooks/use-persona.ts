import { create, type StoreApi, type UseBoundStore } from "zustand";

type ReadonlyStoreApi<T> = Pick<StoreApi<T>, "getState" | "getInitialState" | "subscribe">;
type ReadonlyStore<T> = UseBoundStore<ReadonlyStoreApi<T>>;

interface Persona {
  maxTokens: number;
}

export const usePersona: ReadonlyStore<Persona> = create((set, get) => ({
  maxTokens: 128_000,
}));
