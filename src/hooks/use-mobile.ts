import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { create, type StoreApi, type UseBoundStore } from "zustand";

type ReadonlyStoreApi<T> = Pick<StoreApi<T>, "getState" | "getInitialState" | "subscribe">;
type ReadonlyStore<T> = UseBoundStore<ReadonlyStoreApi<T>>;

const MOBILE_BREAKPOINT = 768;

/**
 * 适用于检查当前的 UI 布局是否为移动端
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => {
      mql.removeEventListener("change", onChange);
    };
  }, []);

  return !!isMobile;
}

interface PlatformEnv {
  isDesktop: boolean;
  isMobile: boolean;
  init: () => Promise<void>;
}

/**
 * 适用于检查当前的环境是否为移动端
 */
export const usePlatform: ReadonlyStore<PlatformEnv> = create((set) => ({
  isDesktop: false,
  isMobile: true,
  init: async () => {
    const isMobile: boolean = await invoke("env_is_mobile");
    set({ isDesktop: !isMobile, isMobile });
  },
}));
