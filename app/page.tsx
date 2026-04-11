"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TranslatePanel from "@/components/TranslatePanel";
import GlossaryManager from "@/components/GlossaryManager";
import SaveModal from "@/components/SaveModal";
import ChangeModal from "@/components/ChangeModal";
import { buildGlossaryPrompt } from "@/lib/glossary";
import {
  translateEmail,
  TargetLanguage,
  LANGUAGE_NAMES,
} from "@/lib/translate";
import {
  getCompanies,
  getThreadsByCompany,
  getThread,
  getLastSave,
  getGlossary,
  addMessageToThread,
  addMilestone,
  setLastSave,
  updateSummary,
} from "@/lib/storage";
import type { Company, Thread, Message, Milestone, Lang, Summary, GlossaryItem } from "@/lib/types";

const LANG_MAP: Record<TargetLanguage, Lang> = { KO: "ko", EN: "en", JA: "ja", ZH: "zh" };

export default function Home() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLang, setTargetLang] = useState<TargetLanguage>("KO");
  const [glossary, setGlossary] = useState<GlossaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replySourceText, setReplySourceText] = useState("");
  const [replyTranslatedText, setReplyTranslatedText] = useState("");
  const [replyTargetLang, setReplyTargetLang] = useState<TargetLanguage>("EN");
  const [replyIsLoading, setReplyIsLoading] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [isMilestoneLoading, setIsMilestoneLoading] = useState(false);
  const [isAgentFormalitiesLoading, setIsAgentFormalitiesLoading] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const [glossaryItems, last] = await Promise.all([
        getGlossary(),
        getLastSave(),
      ]);
      setGlossary(glossaryItems);
      if (last) {
        const companies = await getCompanies();
        const company = companies.find((c) => c.id === last.companyId) ?? null;
        if (company) {
          const threads = await getThreadsByCompany(last.companyId);
          const thread = threads.find((t) => t.id === last.threadId) ?? null;
          setActiveCompany(company);
          setActiveThread(thread);
        }
      }
    }
    init();
  }, []);

  async function handleSaveClick() {
    if (activeCompany && activeThread) {
      // Direct save — no modal
      const message: Message = {
        id: crypto.randomUUID(),
        direction: "inbound",
        originalText: sourceText,
        translatedText,
        lang: LANG_MAP[targetLang],
        createdAt: new Date().toISOString(),
      };
      await addMessageToThread(activeThread.id, message);

      // Save outbound reply if present
      if (replySourceText.trim() && replyTranslatedText.trim()) {
        const replyMessage: Message = {
          id: crypto.randomUUID(),
          direction: "outbound",
          originalText: replySourceText,
          translatedText: replyTranslatedText,
          lang: LANG_MAP[replyTargetLang],
          createdAt: new Date().toISOString(),
        };
        await addMessageToThread(activeThread.id, replyMessage);
      }

      await setLastSave(activeCompany.id, activeThread.id);
      setIsSaved(true);

      // Get latest thread summary (activeThread may be stale)
      const currentThread = await getThread(activeThread.id);

      // Generate summary in background
      try {
        const res = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            existingSummary: currentThread?.summary ?? null,
            originalText: sourceText,
            translatedText,
            replySourceText: replySourceText || undefined,
            replyTranslatedText: replyTranslatedText || undefined,
            companyName: activeCompany.name,
            threadTitle: activeThread.title,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          await updateSummary(activeThread.id, data.summary as Summary);
        } else {
          setIsSaved(false);
        }
      } catch (err) {
        console.error("Summary generation failed:", err);
        setIsSaved(false);
      }
    } else {
      setSaveModalOpen(true);
    }
  }

  async function handleSaveMilestone() {
    if (!activeCompany || !activeThread || !sourceText.trim() || !translatedText.trim()) return;
    setIsMilestoneLoading(true);
    try {
      const res = await fetch("/api/milestone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText: sourceText,
          translatedText,
          replySourceText: replySourceText || undefined,
          replyTranslatedText: replyTranslatedText || undefined,
          companyName: activeCompany.name,
          threadTitle: activeThread.title,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const ms: Milestone = {
          id: crypto.randomUUID(),
          title: data.title,
          content: data.content,
          createdAt: new Date().toISOString(),
        };
        await addMilestone(activeThread.id, ms);
      }
    } catch (err) {
      console.error("Milestone generation failed:", err);
    } finally {
      setIsMilestoneLoading(false);
    }
  }

  async function handleReplyTranslate() {
    if (!replySourceText.trim()) return;
    setReplyIsLoading(true);
    setReplyError("");
    setReplyTranslatedText("");
    try {
      const glossaryPrompt = buildGlossaryPrompt(glossary);
      const result = await translateEmail(replySourceText, replyTargetLang, glossaryPrompt);
      setReplyTranslatedText(result);
    } catch (e) {
      setReplyError(e instanceof Error ? e.message : "Translation failed. Please try again.");
    } finally {
      setReplyIsLoading(false);
    }
  }

  async function handleAddFormalities() {
    if (!sourceText.trim() && !translatedText.trim()) return;
    setIsAgentFormalitiesLoading(true);
    setReplyError("");
    try {
      const res = await fetch("/api/reply-formalities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inboundOriginal: sourceText,
          inboundTranslated: translatedText,
          replyBody: replySourceText,
        }),
      });
      if (!res.ok) throw new Error("서문/마무리 생성에 실패했습니다.");
      const data = await res.json();
      setReplySourceText(data.result);
    } catch (e) {
      setReplyError(e instanceof Error ? e.message : "서문/마무리 생성에 실패했습니다.");
    } finally {
      setIsAgentFormalitiesLoading(false);
    }
  }

  async function handleDraftReply() {
    if (!sourceText.trim() && !translatedText.trim()) return;
    setIsDraftLoading(true);
    setReplyError("");
    try {
      const currentThread = activeThread ? await getThread(activeThread.id) : null;
      const res = await fetch("/api/draft-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inboundOriginal: sourceText,
          inboundTranslated: translatedText,
          summary: currentThread?.summary ?? null,
          companyName: activeCompany?.name ?? "",
          threadTitle: activeThread?.title ?? "",
        }),
      });
      if (!res.ok) throw new Error("답장 초안 생성에 실패했습니다.");
      const data = await res.json();
      setReplySourceText(data.draft);
    } catch (e) {
      setReplyError(e instanceof Error ? e.message : "답장 초안 생성에 실패했습니다.");
    } finally {
      setIsDraftLoading(false);
    }
  }

  async function handleTranslate() {
    if (!sourceText.trim()) return;
    setIsLoading(true);
    setError("");
    setTranslatedText("");
    setIsSaved(false);
    try {
      const glossaryPrompt = buildGlossaryPrompt(glossary);
      const result = await translateEmail(
        sourceText,
        targetLang,
        glossaryPrompt,
      );
      setTranslatedText(result);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Translation failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest text-on-surface min-h-screen">
      {/* Top Nav */}
      <header className="bg-white/80 backdrop-blur-md border-b border-outline-variant/50 flex justify-between items-center w-full px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold text-on-surface tracking-tight">
            메일 번역
          </h1>
          <nav className="hidden md:flex gap-0 items-center">
            <Link href="/" className="nav-item active text-sm font-medium">
              번역
            </Link>
            <Link
              href="/history"
              className="nav-item text-outline hover:text-on-surface text-sm font-medium"
            >
              히스토리
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-surface-container overflow-hidden border border-outline-variant flex items-center justify-center">
            <span
              className="material-symbols-outlined text-outline"
              style={{ fontSize: "20px" }}
            >
              person
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Header Section */}
        <section className="space-y-2">
          <p className="text-[0.75rem] font-medium text-outline uppercase tracking-widest">
            EMAIL TRANSLATION
          </p>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {activeCompany && activeThread ? (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-bold text-on-surface tracking-tight">
                      {activeThread.title}
                    </h2>
                    <button
                      onClick={() => setChangeModalOpen(true)}
                      className="text-xs text-outline hover:text-primary transition-colors mt-1"
                    >
                      변경
                    </button>
                  </div>
                  <p className="text-sm text-outline">{activeCompany.name}</p>
                </>
              ) : (
                <h2 className="text-3xl font-bold text-on-surface tracking-tight">
                  새로운 번역 프로젝트
                </h2>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeCompany && activeThread && (
                <button
                  onClick={handleSaveMilestone}
                  disabled={!sourceText.trim() || !translatedText.trim() || isMilestoneLoading}
                  className="px-4 py-2 border border-outline-variant text-on-surface-variant font-semibold rounded-xl hover:bg-surface-container-low active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>flag</span>
                  {isMilestoneLoading ? "저장 중..." : "마일스톤 저장"}
                </button>
              )}
              <button
                onClick={handleSaveClick}
                disabled={!sourceText.trim() || !translatedText.trim() || isSaved}
                className="px-4 py-2 border border-outline-variant text-on-surface-variant font-semibold rounded-xl hover:bg-surface-container-low active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>save</span>
                저장하기
              </button>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="text-sm text-on-error-container bg-error-container border border-error/20 rounded-xl px-4 py-3 flex items-center gap-2">
            <span
              className="material-symbols-outlined text-error"
              style={{ fontSize: "18px" }}
            >
              error
            </span>
            {error}
          </div>
        )}

        {/* Translation Interface */}
        <TranslatePanel
          sourceText={sourceText}
          translatedText={translatedText}
          isLoading={isLoading}
          targetLang={targetLang}
          onSourceChange={setSourceText}
          onTranslate={handleTranslate}
          onTargetLangChange={setTargetLang}
        />

        {/* Reply Button */}
        <div className="flex justify-start">
          <button
            onClick={() => setReplyOpen((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant text-on-surface-variant font-semibold rounded-xl hover:bg-surface-container-low active:scale-95 transition-all text-sm"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              reply
            </span>
            답장 작성
          </button>
        </div>

        {/* Reply Panel */}
        {replyOpen && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[0.75rem] font-medium text-outline uppercase tracking-widest">
                REPLY (OUTBOUND)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddFormalities}
                  disabled={(!sourceText.trim() && !translatedText.trim()) || isAgentFormalitiesLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant text-on-surface-variant font-medium rounded-lg hover:bg-surface-container-low active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>auto_fix</span>
                  {isAgentFormalitiesLoading ? "생성 중..." : "서문 & 마무리 추가"}
                </button>
                <button
                  onClick={handleDraftReply}
                  disabled={(!sourceText.trim() && !translatedText.trim()) || isDraftLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant text-on-surface-variant font-medium rounded-lg hover:bg-surface-container-low active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>history_edu</span>
                  {isDraftLoading ? "초안 작성 중..." : "히스토리 기반 초안 작성"}
                </button>
              </div>
            </div>
            {replyError && (
              <div className="text-sm text-on-error-container bg-error-container border border-error/20 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-error" style={{ fontSize: "18px" }}>error</span>
                {replyError}
              </div>
            )}
            <TranslatePanel
              sourceText={replySourceText}
              translatedText={replyTranslatedText}
              isLoading={replyIsLoading}
              targetLang={replyTargetLang}
              onSourceChange={setReplySourceText}
              onTranslate={handleReplyTranslate}
              onTargetLangChange={setReplyTargetLang}
              sourceLabel="답장 내용 (한국어)"
              langOptions={["EN", "JA", "ZH"]}
            />
          </div>
        )}

        {/* Glossary */}
        <GlossaryManager entries={glossary} onChange={setGlossary} />
      </main>

      <ChangeModal
        open={changeModalOpen}
        onClose={() => setChangeModalOpen(false)}
        onChanged={(company, thread) => {
          setActiveCompany(company);
          setActiveThread(thread);
        }}
        currentCompanyId={activeCompany?.id}
        currentThreadId={activeThread?.id}
      />

      <SaveModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSaved={(company, thread) => {
          setActiveCompany(company);
          setActiveThread(thread);
          setIsSaved(true);
        }}
        onSummaryError={() => setIsSaved(false)}
        sourceText={sourceText}
        translatedText={translatedText}
        targetLang={targetLang}
        replySourceText={replySourceText || undefined}
        replyTranslatedText={replyTranslatedText || undefined}
        replyTargetLang={replyTargetLang}
      />

      {/* Status Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-inverse-surface text-inverse-on-surface rounded-full flex items-center gap-4 shadow-xl z-50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-xs font-medium">실시간 번역 엔진 가동 중</span>
        </div>
        <div className="w-[1px] h-4 bg-white/20"></div>
        <button className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
          상태 확인
        </button>
      </div>
    </div>
  );
}
