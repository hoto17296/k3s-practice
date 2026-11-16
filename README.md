# K3s Practice
k3s 上で複数サービスを稼働させる練習

| ディレクトリ | 内容                                             | namespace |
| ------------ | ------------------------------------------------ | --------- |
| `shared/`    | 複数サービスから共有で使うサービス群（PostgreSQL） | `shared`  |
| `blog/`      | ブログアプリ                                     | `blog`    |
| `todo/`      | タスク管理アプリ                                 | `todo`    |

各ディレクトリは本来別リポジトリになる想定で、互いのファイルを参照しない。

## ネットワーク分離

NetworkPolicy（k3s 内蔵の kube-router が処理）で通信を制限している。

- `blog` → `shared` の PostgreSQL (5432): 許可
- `todo` → `shared` の PostgreSQL (5432): 許可
- `blog` ↔ `todo`: 拒否（各アプリの namespace は Ingress / Egress とも既定で全拒否）
- Traefik (`kube-system`) → `blog` / `todo` (3000): 許可

```
            Traefik (kube-system)
             │                 │
   blog.localhost        todo.localhost
             ▼                 ▼
     ┌─ ns: blog ─┐     ┌─ ns: todo ─┐
     │    blog    │  ✕  │    todo    │
     └────────────┘     └────────────┘
             │ 5432            │ 5432
             ▼                 ▼
          ┌──── ns: shared ────┐
          │      postgres      │
          └────────────────────┘
```

## セットアップ（Rancher Desktop）

1. Rancher Desktop で Kubernetes を有効にする（コンテナエンジンは dockerd (moby)）
2. 共有サービスを起動し、各アプリ用の DB・ユーザーを作成する → [shared/README.md](shared/README.md)
3. 各アプリをビルドしてデプロイする → [blog/README.md](blog/README.md), [todo/README.md](todo/README.md)
4. http://blog.localhost と http://todo.localhost にアクセスする
