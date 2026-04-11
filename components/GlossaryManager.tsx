"use client";

import { useState } from "react";
import { saveGlossaryItem, deleteGlossaryItem } from "@/lib/storage";
import type { GlossaryItem } from "@/lib/types";

interface Props {
  entries: GlossaryItem[];
  onChange: (entries: GlossaryItem[]) => void;
}

export default function GlossaryManager({ entries, onChange }: Props) {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [editing, setEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  async function handleAdd() {
    const s = source.trim();
    const t = target.trim();
    if (!s || !t) return;
    setIsAdding(true);
    const newItem = await saveGlossaryItem({
      id: crypto.randomUUID(),
      source: s,
      target: t,
    });
    onChange([...entries, newItem]);
    setSource("");
    setTarget("");
    setIsAdding(false);
  }

  async function handleRemove(id: string) {
    await deleteGlossaryItem(id);
    onChange(entries.filter((e) => e.id !== id));
  }

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-outline-variant pb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>book</span>
          <h3 className="font-semibold text-on-surface">
            글로서리{" "}
            <span className="text-outline font-normal text-sm">({entries.length}개 용어)</span>
          </h3>
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className="text-sm font-medium text-primary hover:underline transition-colors"
        >
          {editing ? "닫기" : "편집하기"}
        </button>
      </div>

      {/* Add form — visible when editing */}
      {editing && (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="원본 용어"
            className="flex-1 text-sm border border-outline-variant rounded-xl px-3 py-2 focus:outline-none focus:border-primary bg-surface-container-low text-on-surface placeholder:text-outline/60"
          />
          <span className="text-outline text-sm">→</span>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="번역어"
            className="flex-1 text-sm border border-outline-variant rounded-xl px-3 py-2 focus:outline-none focus:border-primary bg-surface-container-low text-on-surface placeholder:text-outline/60"
          />
          <button
            onClick={handleAdd}
            disabled={!source.trim() || !target.trim() || isAdding}
            className="px-4 py-2 text-sm bg-primary text-white font-semibold rounded-xl hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            {isAdding ? "추가 중..." : "추가"}
          </button>
        </div>
      )}

      {/* Entry grid */}
      {entries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors group"
            >
              <div className="space-y-0.5 min-w-0">
                <p className="text-[0.75rem] text-outline font-medium truncate">{entry.source}</p>
                <p className="text-sm font-semibold text-on-surface truncate">{entry.target}</p>
              </div>
              {editing ? (
                <button
                  onClick={() => handleRemove(entry.id)}
                  className="ml-3 p-1 text-outline hover:text-error transition-colors flex-shrink-0"
                  aria-label="삭제"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                </button>
              ) : (
                <span
                  className="material-symbols-outlined text-outline group-hover:text-primary transition-colors flex-shrink-0 ml-3"
                  style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-outline text-center py-4">
          아직 용어집이 없습니다. 편집하기를 눌러 추가해보세요.
        </p>
      )}
    </div>
  );
}
