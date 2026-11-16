import { SQL } from "bun";

export const sql = new SQL(process.env.DATABASE_URL ?? "postgresql://todo:password@localhost/todo");

export type Task = {
  id: number;
  title: string;
  done: boolean;
  created_at: Date;
  updated_at: Date;
};

export async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id         SERIAL PRIMARY KEY,
      title      TEXT NOT NULL,
      done       BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}
