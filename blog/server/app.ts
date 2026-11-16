import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { validator } from "hono/validator";

import { type Post, sql } from "./db.ts";

type PostInput = { title: string; body: string };

const postInput = validator("json", (value, c) => {
  const { title, body } = (value ?? {}) as Record<string, unknown>;
  if (typeof title !== "string" || title.trim() === "") {
    return c.json({ error: "title is required" }, 400);
  }
  if (typeof body !== "string") {
    return c.json({ error: "body must be a string" }, 400);
  }
  if (title.length > 200) {
    return c.json({ error: "title must be at most 200 characters" }, 400);
  }
  return { title: title.trim(), body } satisfies PostInput;
});

const idParam = validator("param", (value) => {
  const id = Number(value.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new HTTPException(404, { message: "Not Found" });
  }
  return { id };
});

const posts = new Hono()
  .get("/", async (c) => {
    const rows = await sql<Post[]>`
      SELECT id, title, left(body, 200) AS body, created_at, updated_at
      FROM posts ORDER BY created_at DESC, id DESC
    `;
    return c.json(rows);
  })
  .get("/:id", idParam, async (c) => {
    const { id } = c.req.valid("param");
    const [post] = await sql<Post[]>`SELECT * FROM posts WHERE id = ${id}`;
    if (!post) return c.json({ error: "Not Found" }, 404);
    return c.json(post);
  })
  .post("/", postInput, async (c) => {
    const { title, body } = c.req.valid("json");
    const [post] = await sql<Post[]>`
      INSERT INTO posts (title, body) VALUES (${title}, ${body}) RETURNING *
    `;
    return c.json(post, 201);
  })
  .put("/:id", idParam, postInput, async (c) => {
    const { id } = c.req.valid("param");
    const { title, body } = c.req.valid("json");
    const [post] = await sql<Post[]>`
      UPDATE posts SET title = ${title}, body = ${body}, updated_at = now()
      WHERE id = ${id} RETURNING *
    `;
    if (!post) return c.json({ error: "Not Found" }, 404);
    return c.json(post);
  })
  .delete("/:id", idParam, async (c) => {
    const { id } = c.req.valid("param");
    const rows = await sql`DELETE FROM posts WHERE id = ${id} RETURNING id`;
    if (rows.length === 0) return c.json({ error: "Not Found" }, 404);
    return c.body(null, 204);
  });

export const app = new Hono()
  .use(logger())
  .get("/api/health", (c) => c.json({ ok: true }))
  .route("/api/posts", posts);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});
