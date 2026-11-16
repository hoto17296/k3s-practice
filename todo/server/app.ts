import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { validator } from "hono/validator";

import { type Task, sql } from "./db.ts";

const MAX_TITLE = 200;

function parseTitle(title: unknown): string {
  if (typeof title !== "string" || title.trim() === "") {
    throw new HTTPException(400, { message: "title is required" });
  }
  if (title.length > MAX_TITLE) {
    throw new HTTPException(400, { message: `title must be at most ${MAX_TITLE} characters` });
  }
  return title.trim();
}

const createInput = validator("json", (value) => {
  const { title } = (value ?? {}) as Record<string, unknown>;
  return { title: parseTitle(title) };
});

const updateInput = validator("json", (value) => {
  const { title, done } = (value ?? {}) as Record<string, unknown>;
  const input: { title?: string; done?: boolean } = {};
  if (title !== undefined) input.title = parseTitle(title);
  if (done !== undefined) {
    if (typeof done !== "boolean") {
      throw new HTTPException(400, { message: "done must be a boolean" });
    }
    input.done = done;
  }
  if (Object.keys(input).length === 0) {
    throw new HTTPException(400, { message: "title or done is required" });
  }
  return input;
});

const idParam = validator("param", (value) => {
  const id = Number(value.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new HTTPException(404, { message: "Not Found" });
  }
  return { id };
});

const tasks = new Hono()
  .get("/", async (c) => {
    const rows = await sql<Task[]>`
      SELECT * FROM tasks ORDER BY done ASC, created_at DESC, id DESC
    `;
    return c.json(rows);
  })
  .post("/", createInput, async (c) => {
    const { title } = c.req.valid("json");
    const [task] = await sql<Task[]>`
      INSERT INTO tasks (title) VALUES (${title}) RETURNING *
    `;
    return c.json(task, 201);
  })
  .patch("/:id", idParam, updateInput, async (c) => {
    const { id } = c.req.valid("param");
    const { title, done } = c.req.valid("json");
    const [task] = await sql<Task[]>`
      UPDATE tasks SET
        title = COALESCE(${title ?? null}, title),
        done = COALESCE(${done ?? null}::boolean, done),
        updated_at = now()
      WHERE id = ${id} RETURNING *
    `;
    if (!task) return c.json({ error: "Not Found" }, 404);
    return c.json(task);
  })
  .delete("/:id", idParam, async (c) => {
    const { id } = c.req.valid("param");
    const rows = await sql`DELETE FROM tasks WHERE id = ${id} RETURNING id`;
    if (rows.length === 0) return c.json({ error: "Not Found" }, 404);
    return c.body(null, 204);
  });

export const app = new Hono()
  .use(logger())
  .get("/api/health", (c) => c.json({ ok: true }))
  .route("/api/tasks", tasks);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});
