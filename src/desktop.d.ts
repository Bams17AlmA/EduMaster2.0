export {};

declare global {
  interface Window {
    eduMasterDesktop?: {
      loadDatabase: () => Promise<unknown | null>;
      saveDatabase: (state: unknown) => Promise<{ saved: boolean; path: string }>;
      getDatabaseLocation: () => Promise<string>;
    };
  }
}
