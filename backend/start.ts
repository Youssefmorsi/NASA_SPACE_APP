// Set the production mode without shell-specific environment variable syntax.
process.env.NODE_ENV = "production";
await import("./server.ts");
export {};
