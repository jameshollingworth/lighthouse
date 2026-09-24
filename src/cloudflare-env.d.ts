export {};

declare global {
  interface CloudflareEnv {
    ROOMS_DB: D1Database;
  }
}
