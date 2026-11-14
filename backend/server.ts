import path from "node:path";
import app from "./app.ts";

if (process.env.NODE_ENV === "production") {
  const { default: express } = await import("express");
  app.use(express.static(path.resolve("dist")));
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT || 5173);
app.listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(`LunarSight ready at http://127.0.0.1:${port}`),
);
