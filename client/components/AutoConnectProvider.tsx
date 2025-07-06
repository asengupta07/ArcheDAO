/* eslint-disable */
"use client";

import {
  FC,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AUTO_CONNECT_LOCAL_STORAGE_KEY = "AptosWalletAutoConnect";

export interface AutoConnectContextState {
  autoConnect: boolean;
  setAutoConnect(autoConnect: boolean): void;
}

export const AutoConnectContext = createContext<AutoConnectContextState>(
  {} as AutoConnectContextState,
);

export function useAutoConnect(): AutoConnectContextState {
  return useContext(AutoConnectContext);
}

export const AutoConnectProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Initialize to true by default
  const [autoConnect, setAutoConnect] = useState(true);

  useEffect(() => {
    try {
      const isAutoConnect = localStorage.getItem(AUTO_CONNECT_LOCAL_STORAGE_KEY);
      // If no value is set in localStorage, keep it true (default)
      // Only set to false if explicitly set to false in localStorage
      if (isAutoConnect !== null) {
        setAutoConnect(JSON.parse(isAutoConnect));
      } else {
        // Set initial value in localStorage
        localStorage.setItem(AUTO_CONNECT_LOCAL_STORAGE_KEY, JSON.stringify(true));
      }
    } catch (e) {
      if (typeof window !== "undefined") {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(AUTO_CONNECT_LOCAL_STORAGE_KEY, JSON.stringify(autoConnect));
    } catch (error: any) {
      if (typeof window !== "undefined") {
        console.error(error);
      }
    }
  }, [autoConnect]);

  return (
    <AutoConnectContext.Provider value={{ autoConnect, setAutoConnect }}>
      {children}
    </AutoConnectContext.Provider>
  );
};
