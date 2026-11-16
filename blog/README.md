# Blog

ブログアプリ（記事の一覧・閲覧・作成・編集・削除）

- フロントエンド: React + Vite (`src/`)
- バックエンド: Hono on Bun (`server/`)
- データベース: PostgreSQL（起動時に `posts` テーブルを自動作成）

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
| `DATABASE_URL` | `postgresql://blog:password@localhost/blog` |
| `PORT`         | `3000`                                      |

## API

| メソッド | パス             | 説明                                       |
| -------- | ---------------- | ------------------------------------------ |
| GET      | `/api/posts`     | 記事一覧（本文は先頭 200 文字）            |
| GET      | `/api/posts/:id` | 記事詳細                                   |
| POST     | `/api/posts`     | 作成 `{ "title": string, "body": string }` |
| PUT      | `/api/posts/:id` | 更新 `{ "title": string, "body": string }` |
| DELETE   | `/api/posts/:id` | 削除                                       |

## Kubernetes (k3s)

namespace `blog` にデプロイし、Traefik の Ingress で http://blog.localhost に公開する。
DB は shared の PostgreSQL を使う。事前に shared 側で DB・ユーザー `blog` を作成しておくこと。

```sh
docker build -t blog:dev .   # Rancher Desktop (moby) ならビルドしたイメージを k3s がそのまま使える
kubectl apply -k k8s
kubectl -n blog rollout status deployment/blog
```

コードを変更したら、再ビルドしてから `kubectl -n blog rollout restart deployment/blog` を実行する。

NetworkPolicy により、この namespace の Pod は以下の通信しかできない。

- Ingress: Traefik (`kube-system`) から TCP 3000
- Egress: CoreDNS への DNS、`shared` の PostgreSQL への TCP 5432
