import { serveStatic } from "hono/bun";

import { app } from "./app.ts";
import { migrate } from "./db.ts";

await migrate();

// 本番時はビルド済みのフロントエンド (dist/) も配信する
app.use("/*", serveStatic({ root: "./dist" }));
app.get("*", serveStatic({ path: "./dist/index.html" }));

const port = Number(process.env.PORT ?? 3000);
console.log(`Server listening on http://localhost:${port}`);

export default { port, fetch: app.fetch };
