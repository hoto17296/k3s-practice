export type Post = {
  id: number;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type PostInput = { title: string; body: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `${res.status} ${res.statusText}`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const api = {
  listPosts: () => request<Post[]>("/posts"),
  getPost: (id: number) => request<Post>(`/posts/${id}`),
  createPost: (input: PostInput) =>
    request<Post>("/posts", { method: "POST", body: JSON.stringify(input) }),
  updatePost: (id: number, input: PostInput) =>
    request<Post>(`/posts/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  deletePost: (id: number) => request<void>(`/posts/${id}`, { method: "DELETE" }),
};
