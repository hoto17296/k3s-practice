# Shared

複数サービスから共有で使うサービス群。namespace `shared` にデプロイする。

| サービス   | 接続先                                     |
| ---------- | ------------------------------------------ |
| PostgreSQL | `postgres.shared.svc.cluster.local:5432` |

## デプロイ

```sh
kubectl apply -k k8s
kubectl -n shared rollout status statefulset/postgres
```

## 利用側（クライアント）の条件

shared のサービスには、以下を満たす namespace からのみ接続できる。

- namespace にラベル `k3s-practice/shared-access: "true"` を付ける（shared 側の Ingress 許可条件）
- 利用側で Egress を絞っている場合は、`shared` namespace の `app.kubernetes.io/name: postgres` の Pod への TCP 5432 を許可する

## アプリ用の DB・ユーザーの作成

アプリごとに DB とユーザーを手動で作る。`REVOKE CONNECT ... FROM PUBLIC` で、他アプリのユーザーから DB に接続できないようにする。

```sh
APP=blog   # todo の場合は APP=todo
kubectl -n shared exec -i statefulset/postgres -- psql -U postgres -v ON_ERROR_STOP=1 <<SQL
CREATE USER $APP PASSWORD 'password';
CREATE DATABASE $APP OWNER $APP;
REVOKE CONNECT ON DATABASE $APP FROM PUBLIC;
SQL
```

パスワードは練習用にアプリ側のマニフェストへ直書きしている（シークレット管理は今後の課題）。

## 削除

```sh
kubectl delete -k k8s   # PVC（データ）は残る
kubectl -n shared delete pvc data-postgres-0
```
