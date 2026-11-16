# Todo

タスク管理アプリ（タスクの一覧・追加・完了切り替え・編集・削除）

- フロントエンド: React + Vite (`src/`)
- バックエンド: Hono on Bun (`server/`)
- データベース: PostgreSQL（起動時に `tasks` テーブルを自動作成）

## 開発

```sh
bun install
bun run dev   # Vite (http://localhost:5173) と API サーバ (:3000) を同時に起動
```

`/api` へのリクエストは Vite から API サーバへプロキシされます。個別に起動する場合は `bun run dev:client` / `bun run dev:server` を使います。

## 本番

```sh
bun run build   # dist/ にフロントエンドをビルド
bun run start   # API と dist/ を http://localhost:3000 で配信
```

## 環境変数

| 名前           | デフォルト                                  |
| -------------- | ------------------------------------------- |
| `DATABASE_URL` | `postgresql://todo:password@localhost/todo` |
| `PORT`         | `3000`                                      |

## API

| メソッド | パス             | 説明                                          |
| -------- | ---------------- | --------------------------------------------- |
| GET      | `/api/tasks`     | タスク一覧（未完了 → 完了、新しい順）         |
| POST     | `/api/tasks`     | 作成 `{ "title": string }`                    |
| PATCH    | `/api/tasks/:id` | 更新 `{ "title"?: string, "done"?: boolean }` |
| DELETE   | `/api/tasks/:id` | 削除                                          |
