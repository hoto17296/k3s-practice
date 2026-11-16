import { type FormEvent, useEffect, useState } from "react";

import { type Task, api } from "./api.ts";

type Filter = "all" | "active" | "done";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "active", label: "未完了" },
  { value: "done", label: "完了" },
];

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) =>
      Number(a.done) - Number(b.done) || b.created_at.localeCompare(a.created_at) || b.id - a.id,
  );
}

export default function App() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    api
      .listTasks()
      .then(setTasks)
      .catch((e: Error) => setError(e.message));
  }, []);

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const replace = (task: Task) =>
    setTasks((prev) => sortTasks((prev ?? []).map((t) => (t.id === task.id ? task : t))));

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    run(async () => {
      const task = await api.createTask(value);
      setTasks((prev) => sortTasks([task, ...(prev ?? [])]));
      setTitle("");
    });
  };

  const handleToggle = (task: Task) =>
    run(async () => replace(await api.updateTask(task.id, { done: !task.done })));

  const handleDelete = (task: Task) =>
    run(async () => {
      await api.deleteTask(task.id);
      setTasks((prev) => (prev ?? []).filter((t) => t.id !== task.id));
    });

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditingTitle(task.title);
  };

  const commitEdit = (task: Task) => {
    const value = editingTitle.trim();
    setEditingId(null);
    if (!value || value === task.title) return;
    run(async () => replace(await api.updateTask(task.id, { title: value })));
  };

  const visible = (tasks ?? []).filter((t) =>
    filter === "all" ? true : filter === "done" ? t.done : !t.done,
  );
  const remaining = (tasks ?? []).filter((t) => !t.done).length;

  return (
    <main>
      <h1>Todo</h1>

      <form className="add" onSubmit={handleAdd}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="新しいタスクを入力"
          maxLength={200}
          aria-label="新しいタスク"
        />
        <button type="submit" disabled={!title.trim()}>
          追加
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="toolbar">
        <span className="muted">残り {remaining} 件</span>
        <div className="filters" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={filter === f.value}
              className={filter === f.value ? "active" : ""}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {tasks === null ? (
        !error && <p className="muted">読み込み中…</p>
      ) : visible.length === 0 ? (
        <p className="muted empty">タスクはありません</p>
      ) : (
        <ul className="tasks">
          {visible.map((task) => (
            <li key={task.id} className={task.done ? "done" : ""}>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => handleToggle(task)}
                aria-label={`${task.title} を${task.done ? "未完了" : "完了"}にする`}
              />
              {editingId === task.id ? (
                <input
                  className="edit"
                  value={editingTitle}
                  autoFocus
                  maxLength={200}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => commitEdit(task)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) commitEdit(task);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
              ) : (
                <span
                  className="title"
                  onDoubleClick={() => startEdit(task)}
                  title="ダブルクリックで編集"
                >
                  {task.title}
                </span>
              )}
              <button
                type="button"
                className="delete"
                onClick={() => handleDelete(task)}
                aria-label="削除"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
