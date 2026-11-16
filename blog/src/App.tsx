import { type FormEvent, useEffect, useState } from "react";

import { api, type Post, type PostInput } from "./api.ts";
import { Link } from "./Link.tsx";
import { navigate, usePath } from "./router.ts";

const formatDate = (s: string) => new Date(s).toLocaleString("ja-JP");

// fn(arg) を実行して結果を返す。fn は安定した参照を渡すこと
function useAsync<A, T>(fn: (arg: A) => Promise<T>, arg: A) {
  const [result, setResult] = useState<{ arg: A; data?: T; error?: string }>();
  useEffect(() => {
    let active = true;
    fn(arg).then(
      (data) => active && setResult({ arg, data }),
      (e: Error) => active && setResult({ arg, error: e.message }),
    );
    return () => {
      active = false;
    };
  }, [fn, arg]);
  // 結果が現在の arg に対するものでなければ読み込み中とみなす
  if (!result || !Object.is(result.arg, arg)) return { loading: true } as const;
  return { data: result.data, error: result.error, loading: false } as const;
}

function PostList() {
  const { data, error, loading } = useAsync(api.listPosts, undefined);
  if (loading) return <p>読み込み中...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!data?.length) return <p className="muted">まだ記事がありません。</p>;
  return (
    <ul className="post-list">
      {data.map((post) => (
        <li key={post.id}>
          <Link href={`/posts/${post.id}`}>
            <h2>{post.title}</h2>
          </Link>
          <time className="muted">{formatDate(post.created_at)}</time>
          <p className="excerpt">{post.body}</p>
        </li>
      ))}
    </ul>
  );
}

function PostDetail({ id }: { id: number }) {
  const { data: post, error, loading } = useAsync(api.getPost, id);
  if (loading) return <p>読み込み中...</p>;
  if (error || !post) return <p className="error">{error}</p>;

  const onDelete = async () => {
    if (!confirm("この記事を削除しますか？")) return;
    try {
      await api.deletePost(id);
      navigate("/");
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <article>
      <h1>{post.title}</h1>
      <p className="muted">
        {formatDate(post.created_at)}
        {post.updated_at !== post.created_at && `（更新: ${formatDate(post.updated_at)}）`}
      </p>
      <div className="body">{post.body}</div>
      <div className="actions">
        <Link href={`/posts/${id}/edit`} className="button">
          編集
        </Link>
        <button type="button" className="danger" onClick={onDelete}>
          削除
        </button>
      </div>
    </article>
  );
}

function PostForm({
  initial,
  onSubmit,
}: {
  initial?: PostInput;
  onSubmit: (input: PostInput) => Promise<Post>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(undefined);
    try {
      const post = await onSubmit({ title, body });
      navigate(`/posts/${post.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      <label>
        タイトル
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
      </label>
      <label>
        本文
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={16} />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button type="submit" disabled={submitting}>
          {submitting ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}

function EditPost({ id }: { id: number }) {
  const { data: post, error, loading } = useAsync(api.getPost, id);
  if (loading) return <p>読み込み中...</p>;
  if (error || !post) return <p className="error">{error}</p>;
  return (
    <>
      <h1>記事を編集</h1>
      <PostForm initial={post} onSubmit={(input) => api.updatePost(id, input)} />
    </>
  );
}

function Page({ path }: { path: string }) {
  if (path === "/") return <PostList />;
  if (path === "/posts/new") {
    return (
      <>
        <h1>新しい記事</h1>
        <PostForm onSubmit={api.createPost} />
      </>
    );
  }
  const m = path.match(/^\/posts\/(\d+)(\/edit)?$/);
  if (m) {
    const id = Number(m[1]);
    return m[2] ? <EditPost key={id} id={id} /> : <PostDetail key={id} id={id} />;
  }
  return <p>ページが見つかりません。</p>;
}

export default function App() {
  const path = usePath();
  return (
    <>
      <header>
        <Link href="/" className="logo">
          Blog
        </Link>
        <Link href="/posts/new" className="button">
          新規投稿
        </Link>
      </header>
      <main>
        <Page path={path} />
      </main>
    </>
  );
}
