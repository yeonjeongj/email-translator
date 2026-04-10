"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCompanies,
  getThreadsByCompany,
  addMilestone,
} from "@/lib/storage";
import type { Company, Thread, Message, Milestone } from "@/lib/types";

const LANG_LABEL: Record<string, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

const STATUS_LABEL: Record<string, string> = {
  ongoing: "Active Thread",
  pending: "Pending",
  done: "Completed",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function HistoryPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedThreadId, setSelectedThreadId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [milestoneForm, setMilestoneForm] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    const loaded = getCompanies();
    setCompanies(loaded);
    if (loaded.length > 0) {
      const firstId = loaded[0].id;
      setSelectedCompanyId(firstId);
      const companyThreads = getThreadsByCompany(firstId);
      setThreads(companyThreads);
      if (companyThreads.length > 0) {
        setSelectedThreadId(companyThreads[0].id);
      }
    }
  }, []);

  function handleSelectCompany(companyId: string) {
    setSelectedCompanyId(companyId);
    const companyThreads = getThreadsByCompany(companyId);
    setThreads(companyThreads);
    setSelectedThreadId(companyThreads[0]?.id ?? "");
    setSearch("");
    setMilestoneForm(null);
  }

  function handleSubmitMilestone() {
    if (!milestoneForm || !selectedThreadId) return;
    if (!milestoneForm.title.trim() || !milestoneForm.content.trim()) return;
    const milestone: Milestone = {
      id: crypto.randomUUID(),
      title: milestoneForm.title.trim(),
      content: milestoneForm.content.trim(),
      createdAt: new Date().toISOString(),
    };
    addMilestone(selectedThreadId, milestone);
    const updated = getThreadsByCompany(selectedCompanyId);
    setThreads(updated);
    setMilestoneForm(null);
  }

  const filteredThreads = threads.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.summary?.oneliner ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null;
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) ?? null;

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      {/* Top NavBar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-outline-variant/50 sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 py-3">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold text-on-surface tracking-tight">메일 번역</span>
            <nav className="flex gap-0 items-center">
              <Link href="/" className="nav-item text-outline hover:text-on-surface text-sm font-medium">
                번역
              </Link>
              <Link href="/history" className="nav-item active text-sm font-medium">
                히스토리
              </Link>
            </nav>
          </div>
          <div className="w-8 h-8 rounded-full bg-surface-container overflow-hidden border border-outline-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: "20px" }}>person</span>
          </div>
        </div>
      </header>

      {/* Main 3-column layout */}
      <main className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>

        {/* Column 1: Sidebar */}
        <aside className="flex flex-col w-64 p-4 gap-2 bg-surface-container-low border-r border-outline-variant/50 shrink-0" style={{ height: "100vh" }}>
          <div className="px-2 py-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-outline-variant">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>archive</span>
              </div>
              <div>
                <h2 className="text-on-surface font-semibold text-sm">Project Archive</h2>
                <p className="text-outline text-xs">{companies.length}개 회사</p>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 mb-4 bg-primary text-white rounded-lg font-semibold shadow-sm hover:brightness-110 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>
            <span className="text-sm">New Translation</span>
          </Link>

          {companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-2 opacity-40">
              <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>inbox</span>
              <p className="text-xs text-center">저장된 회사가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-1">
              {companies.map((company) => {
                const isActive = selectedCompanyId === company.id;
                const threadCount = getThreadsByCompany(company.id).length;
                return (
                  <button
                    key={company.id}
                    onClick={() => handleSelectCompany(company.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                      isActive
                        ? "bg-white text-primary font-semibold shadow-sm"
                        : "text-outline hover:bg-white/50 hover:text-on-surface hover:translate-x-1 duration-200"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined ${isActive ? "text-primary" : ""}`}
                      style={{ fontSize: "20px" }}
                    >
                      business
                    </span>
                    <span className="text-sm flex-1 truncate">{company.name}</span>
                    {threadCount > 0 && (
                      <span className="text-[10px] font-bold bg-surface-container-low px-1.5 py-0.5 rounded-full">
                        {threadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Column 2: Thread List */}
        <section className="w-80 bg-white border-r border-outline-variant/50 flex flex-col overflow-hidden shrink-0" style={{ height: "100vh" }}>
          <div className="p-6 border-b border-outline-variant/50">
            <h3 className="text-lg font-semibold text-on-surface">
              {selectedCompany ? `${selectedCompany.name} 히스토리` : "히스토리"}
            </h3>
            <div className="mt-4 relative">
              <span
                className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                style={{ fontSize: "18px" }}
              >
                search
              </span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-sm focus:ring-1 focus:ring-primary outline-none"
                placeholder="검색..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            {filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40 p-8">
                <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>folder_open</span>
                <p className="text-xs text-center">
                  {companies.length === 0
                    ? "번역을 저장하면 여기에 표시됩니다"
                    : "이 회사의 프로젝트가 없습니다"}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredThreads.map((thread) => {
                  const isActive = selectedThreadId === thread.id;
                  const preview = thread.summary?.oneliner ?? thread.messages[0]?.originalText ?? "";
                  return (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={`w-full text-left p-4 rounded-xl cursor-pointer transition-colors ${
                        isActive
                          ? "bg-surface-container-low border border-primary/10"
                          : "hover:bg-surface-container-low border border-transparent"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            isActive ? "text-primary" : "text-outline"
                          }`}
                        >
                          {formatDate(thread.createdAt)}
                        </span>
                        <span className="text-[10px] text-outline">{thread.messages.length}건</span>
                      </div>
                      <h4 className="font-semibold text-on-surface text-sm mb-1 line-clamp-1">{thread.title}</h4>
                      <p className="text-xs text-on-surface-variant line-clamp-2">{preview}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Column 3: Detail View */}
        <section className="flex-1 bg-surface overflow-y-auto p-8" style={{ height: "100vh", scrollbarWidth: "none" }}>
          {!selectedThread ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
              <span className="material-symbols-outlined" style={{ fontSize: "48px" }}>auto_stories</span>
              <p className="text-sm font-bold tracking-[0.15em] uppercase">프로젝트를 선택하세요</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">

              {/* Header Info */}
              <div className="flex justify-between items-end">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                      {selectedThread.summary ? STATUS_LABEL[selectedThread.summary.status] ?? "Active Thread" : "Active Thread"}
                    </span>
                    <span className="text-outline text-xs">ID: #{selectedThread.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <h1 className="text-3xl font-bold text-on-surface tracking-tight">{selectedThread.title}</h1>
                </div>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-3 gap-6">

                {/* AI Summary Card */}
                <div className="col-span-2 p-6 rounded-2xl bg-white border border-outline-variant/50 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className="material-symbols-outlined text-primary"
                      style={{ fontVariationSettings: "'FILL' 1", fontSize: "20px" }}
                    >
                      auto_awesome
                    </span>
                    <h3 className="font-bold text-on-surface">AI 요약</h3>
                  </div>
                  {selectedThread.summary ? (
                    <>
                      <p className="text-on-surface-variant leading-relaxed text-sm">
                        {selectedThread.summary.oneliner}
                      </p>
                      {selectedThread.summary.topics.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {selectedThread.summary.topics.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-surface-container-low rounded-full text-[11px] font-medium text-outline"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-outline text-sm italic">
                      아직 요약이 생성되지 않았습니다. 번역을 저장하면 자동으로 생성됩니다.
                    </p>
                  )}
                </div>

                {/* Metadata Card */}
                <div className="col-span-1 p-6 rounded-2xl bg-white border border-outline-variant/50 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                  <h3 className="font-bold text-on-surface mb-4 text-sm">기타 정보</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase">회사</p>
                      <p className="text-sm font-medium">{selectedCompany?.name ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase">메시지 수</p>
                      <p className="text-sm font-medium">{selectedThread.messages.length}건</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase">최종 업데이트</p>
                      <p className="text-sm font-medium">
                        {selectedThread.summary
                          ? timeAgo(selectedThread.summary.updatedAt)
                          : selectedThread.messages.length > 0
                          ? timeAgo(selectedThread.messages[selectedThread.messages.length - 1].createdAt)
                          : formatDate(selectedThread.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase">생성일</p>
                      <p className="text-sm font-medium">{formatDate(selectedThread.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Milestone Timeline */}
                <div className="col-span-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>flag</span>
                      주요 합의 사항
                    </h3>
                    <button
                      onClick={() => setMilestoneForm(milestoneForm ? null : { title: "", content: "" })}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
                      Add milestone
                    </button>
                  </div>

                  {milestoneForm && (
                    <div className="mb-4 p-5 rounded-2xl bg-white border border-primary/20 shadow-[0_4px_12px_rgba(0,0,0,0.04)] space-y-3">
                      <input
                        className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
                        placeholder="제목 (예: 납품일 합의)"
                        value={milestoneForm.title}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                      />
                      <textarea
                        className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                        placeholder="합의 내용을 간략히 기록하세요"
                        rows={3}
                        value={milestoneForm.content}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, content: e.target.value })}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setMilestoneForm(null)}
                          className="text-xs font-semibold text-outline hover:text-on-surface px-3 py-1.5 rounded-lg transition-colors"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleSubmitMilestone}
                          className="text-xs font-semibold text-white bg-primary hover:brightness-110 px-4 py-1.5 rounded-lg transition-all"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  )}

                  {(selectedThread.milestones ?? []).length === 0 && !milestoneForm ? (
                    <p className="text-xs text-outline italic px-1">아직 기록된 합의 사항이 없습니다.</p>
                  ) : (
                    <div className="relative pl-5 space-y-4">
                      <div className="absolute left-1.5 top-2 bottom-2 w-px bg-outline-variant/40" />
                      {(selectedThread.milestones ?? []).map((ms) => (
                        <div key={ms.id} className="relative">
                          <div className="absolute -left-[14px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white" />
                          <div className="p-4 rounded-xl bg-white border border-outline-variant/50 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                            <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">{formatDate(ms.createdAt)}</p>
                            <p className="text-sm font-semibold text-on-surface mb-1">{ms.title}</p>
                            <p className="text-xs text-on-surface-variant leading-relaxed">{ms.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="col-span-3 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-outline" style={{ fontSize: "20px" }}>mail</span>
                      최근 이메일
                    </h3>
                    <span className="text-[10px] text-outline">최근 10건 보존</span>
                  </div>
                  {selectedThread.messages.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white border border-outline-variant/50 text-center text-outline text-sm">
                      저장된 메시지가 없습니다.
                    </div>
                  ) : (
                    [...selectedThread.messages].reverse().map((msg: Message, idx: number) => (
                      <div
                        key={msg.id}
                        className="p-8 rounded-2xl bg-white border border-outline-variant/50 shadow-[0_8px_24px_rgba(0,0,0,0.03)]"
                      >
                        <div className="flex items-center gap-2 mb-6">
                          <span className="text-[10px] font-bold text-outline uppercase tracking-widest">
                            #{idx + 1} · {msg.direction === "inbound" ? "수신" : "발신"} · {formatDate(msg.createdAt)}
                          </span>
                        </div>
                        <div className="flex gap-8">
                          {/* Original */}
                          <div className="flex-1 space-y-4">
                            <h4 className="text-[10px] font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant inline-block"></span>
                              {msg.direction === "inbound" ? "원본 이메일" : "작성한 답장 (한국어)"}
                            </h4>
                            <div className="text-on-surface text-sm leading-loose p-6 bg-surface-container-low rounded-xl border-l-4 border-outline-variant italic whitespace-pre-wrap">
                              {msg.originalText}
                            </div>
                          </div>

                          {/* Translated */}
                          <div className="flex-1 space-y-4">
                            <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                              {msg.direction === "inbound" ? `번역된 내용 (${LANG_LABEL[msg.lang] ?? msg.lang})` : `번역 결과 (${LANG_LABEL[msg.lang] ?? msg.lang})`}
                            </h4>
                            <div className="text-on-surface text-sm leading-loose p-6 bg-primary/5 rounded-xl border-l-4 border-primary whitespace-pre-wrap">
                              {msg.translatedText}
                            </div>
                          </div>
                        </div>

                        {/* Footer actions */}
                        <div className="mt-8 pt-8 border-t border-outline-variant/50">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => navigator.clipboard.writeText(msg.translatedText)}
                              className="flex items-center gap-2 text-xs font-semibold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>content_copy</span>
                              복사하기
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Action Items from summary */}
                  {selectedThread.summary && selectedThread.summary.actions.length > 0 && (
                    <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/50">
                      <h3 className="font-bold text-on-surface mb-4">추천 액션 아이템</h3>
                      <div className="space-y-3">
                        {selectedThread.summary.actions.map((action, i) => (
                          <div
                            key={i}
                            className="p-4 bg-white rounded-xl border border-outline-variant/50 flex items-start gap-3"
                          >
                            <span className="material-symbols-outlined text-primary mt-0.5" style={{ fontSize: "16px" }}>
                              task_alt
                            </span>
                            <p className="text-sm text-on-surface">{action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer anchor */}
              <div className="py-12 flex flex-col items-center opacity-30">
                <span className="material-symbols-outlined" style={{ fontSize: "36px" }}>auto_stories</span>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase mt-2">End of Archive Thread</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
