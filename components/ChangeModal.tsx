"use client";

import { useEffect, useState } from "react";
import {
  getCompanies,
  saveCompany,
  getThreadsByCompany,
  saveThread,
  setLastSave,
} from "@/lib/storage";
import type { Company, Thread, Lang } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onChanged: (company: Company, thread: Thread) => void;
  currentCompanyId?: string;
  currentThreadId?: string;
}

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
];

type Step = "company" | "thread";

export default function ChangeModal({ open, onClose, onChanged, currentCompanyId, currentThreadId }: Props) {
  // Company state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyLang, setNewCompanyLang] = useState<Lang>("en");
  const [isNewCompany, setIsNewCompany] = useState(false);

  // Thread state
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>("");
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [isNewThread, setIsNewThread] = useState(false);

  const [step, setStep] = useState<Step>("company");

  useEffect(() => {
    if (open) {
      const loaded = getCompanies();
      setCompanies(loaded);
      const preselectedCompanyId = currentCompanyId ?? loaded[0]?.id ?? "";
      setSelectedCompanyId(preselectedCompanyId);
      setIsNewCompany(loaded.length === 0);
      setNewCompanyName("");
      setNewCompanyLang("en");
      setStep("company");
      setSelectedThreadId(currentThreadId ?? "");
      setNewThreadTitle("");
      setIsNewThread(false);
    }
  }, [open]);

  function handleCompanyNext() {
    let company: Company;

    if (isNewCompany) {
      if (!newCompanyName.trim()) return;
      company = {
        id: crypto.randomUUID(),
        name: newCompanyName.trim(),
        defaultLang: newCompanyLang,
        createdAt: new Date().toISOString(),
      };
      saveCompany(company);
      setCompanies((prev) => [...prev, company]);
      setSelectedCompanyId(company.id);
    } else {
      if (!selectedCompanyId) return;
      company = companies.find((c) => c.id === selectedCompanyId)!;
    }

    const companyThreads = getThreadsByCompany(company.id);
    setThreads(companyThreads);
    const preselectedThreadId =
      company.id === currentCompanyId && currentThreadId
        ? currentThreadId
        : companyThreads[0]?.id ?? "";
    setSelectedThreadId(preselectedThreadId);
    setIsNewThread(companyThreads.length === 0);
    setStep("thread");
  }

  function handleSave() {
    const companyId = isNewCompany
      ? companies[companies.length - 1]?.id
      : selectedCompanyId;
    if (!companyId) return;

    const finalCompany = companies.find((c) => c.id === companyId)!;
    let savedThread: Thread;

    if (isNewThread) {
      if (!newThreadTitle.trim()) return;
      savedThread = {
        id: crypto.randomUUID(),
        companyId,
        title: newThreadTitle.trim(),
        messages: [],
        milestones: [],
        summary: null,
        createdAt: new Date().toISOString(),
      };
      saveThread(savedThread);
    } else {
      if (!selectedThreadId) return;
      savedThread = threads.find((t) => t.id === selectedThreadId)!;
    }

    setLastSave(companyId, savedThread.id);
    onChanged(finalCompany, savedThread);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
          <h2 className="font-semibold text-on-surface text-base">
            회사 및 프로젝트 변경
          </h2>
          <button
            onClick={onClose}
            className="text-outline hover:text-on-surface transition-colors"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "20px" }}
            >
              close
            </span>
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-widest">
          <span
            className={step === "company" ? "text-primary" : "text-outline"}
          >
            1. 회사
          </span>
          <span className="text-outline-variant">›</span>
          <span className={step === "thread" ? "text-primary" : "text-outline"}>
            2. 프로젝트
          </span>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* ── Step 1: Company ── */}
          {step === "company" && (
            <>
              {companies.length > 0 && !isNewCompany && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-outline uppercase tracking-wide">
                    회사 선택
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface bg-surface-container-low focus:outline-none focus:border-primary"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setIsNewCompany(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    + 새 회사 추가
                  </button>
                </div>
              )}

              {(isNewCompany || companies.length === 0) && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-outline uppercase tracking-wide">
                    새 회사
                  </label>
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCompanyNext()}
                    placeholder="회사명"
                    className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface bg-surface-container-low focus:outline-none focus:border-primary placeholder:text-outline/60"
                    autoFocus
                  />
                  <div className="space-y-1">
                    <label className="text-xs text-outline">
                      기본 번역 언어
                    </label>
                    <div className="flex gap-2">
                      {LANG_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setNewCompanyLang(opt.value)}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                            newCompanyLang === opt.value
                              ? "border-primary bg-primary-container/20 text-primary"
                              : "border-outline-variant text-outline hover:border-primary/50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {companies.length > 0 && (
                    <button
                      onClick={() => setIsNewCompany(false)}
                      className="text-xs text-outline hover:text-on-surface"
                    >
                      ← 기존 회사 선택
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={handleCompanyNext}
                disabled={
                  isNewCompany ? !newCompanyName.trim() : !selectedCompanyId
                }
                className="w-full py-2.5 bg-primary text-white font-semibold rounded-xl hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
              >
                다음
              </button>
            </>
          )}

          {/* ── Step 2: Thread ── */}
          {step === "thread" && (
            <>
              {threads.length > 0 && !isNewThread && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-outline uppercase tracking-wide">
                    프로젝트 선택
                  </label>
                  <select
                    value={selectedThreadId}
                    onChange={(e) => setSelectedThreadId(e.target.value)}
                    className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface bg-surface-container-low focus:outline-none focus:border-primary"
                  >
                    {threads.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setIsNewThread(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    + 새 프로젝트 추가
                  </button>
                </div>
              )}

              {(isNewThread || threads.length === 0) && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-outline uppercase tracking-wide">
                    새 프로젝트
                  </label>
                  <input
                    type="text"
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    placeholder="프로젝트 제목"
                    className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface bg-surface-container-low focus:outline-none focus:border-primary placeholder:text-outline/60"
                    autoFocus
                  />
                  {threads.length > 0 && (
                    <button
                      onClick={() => setIsNewThread(false)}
                      className="text-xs text-outline hover:text-on-surface"
                    >
                      ← 기존 프로젝트 선택
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep("company")}
                  className="flex-1 py-2.5 border border-outline-variant text-on-surface-variant font-semibold rounded-xl hover:bg-surface-container-low active:scale-95 transition-all text-sm"
                >
                  이전
                </button>
                <button
                  onClick={handleSave}
                  disabled={
                    isNewThread ? !newThreadTitle.trim() : !selectedThreadId
                  }
                  className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
                >
                  변경
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
