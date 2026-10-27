/// <reference types="vite/client" />

declare const process: {
  env: {
    BACKEND_URL?: string;
    [key: string]: string | undefined;
  };
};

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PORTAL_NAME?: string;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
