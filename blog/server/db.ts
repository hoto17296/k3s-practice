import { SQL } from "bun";

export const sql = new SQL(process.env.DATABASE_URL ?? "postgresql://blog:password@localhost/blog");

export type Post = {
  id: number;
  title: string;
  body: string;
  created_at: Date;
  updated_at: Date;
};

export async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id         SERIAL PRIMARY KEY,
      title      TEXT NOT NULL,
      body       TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}
