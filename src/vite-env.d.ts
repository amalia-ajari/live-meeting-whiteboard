/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LIVEKIT_URL: string;
  readonly VITE_LIVEKIT_TOKEN: string;
  readonly VITE_LIVEKIT_API_KEY: string;
  readonly VITE_LIVEKIT_API_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
