"use client";

import { useState } from "react";
import { TargetLanguage, LANGUAGE_NAMES } from "@/lib/translate";

interface Props {
  sourceText: string;
  translatedText: string;
  isLoading: boolean;
  targetLang: TargetLanguage;
  onSourceChange: (text: string) => void;
  onTranslate: () => void;
  onTargetLangChange: (lang: TargetLanguage) => void;
  sourceLabel?: string;
  langOptions?: TargetLanguage[];
}

export default function TranslatePanel({
  sourceText,
  translatedText,
  isLoading,
  targetLang,
  onSourceChange,
  onTranslate,
  onTargetLangChange,
  sourceLabel = "원문",
  langOptions,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!translatedText) return;
    await navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const charCount = sourceText.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Source Text Column */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-on-surface">{sourceLabel}</span>
            <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant text-[0.7rem] font-bold rounded uppercase">
              원본
            </span>
          </div>
          <span className="text-[0.75rem] font-medium text-outline">
            {charCount.toLocaleString()} / 5,000자
          </span>
        </div>
        <div className="relative group h-[400px] bg-white border border-outline-variant rounded-xl overflow-hidden focus-within:border-primary transition-all">
          <textarea
            value={sourceText}
            onChange={(e) => onSourceChange(e.target.value)}
            maxLength={5000}
            placeholder="이메일 내용을 입력하세요..."
            className="w-full h-full p-6 text-base border-none focus:ring-0 resize-none bg-transparent placeholder:text-outline/50 text-on-surface leading-relaxed"
          />
          {sourceText && (
            <div className="absolute bottom-4 right-4">
              <button
                onClick={() => onSourceChange("")}
                className="p-2 text-outline hover:text-on-surface transition-colors"
                title="내용 지우기"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Translation Result Column */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-on-surface">번역 결과</span>
            {/* Language selector as badge pills */}
            <div className="flex items-center gap-1">
              {(langOptions ?? (Object.keys(LANGUAGE_NAMES) as TargetLanguage[])).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onTargetLangChange(lang)}
                  className={`px-2 py-0.5 text-[0.7rem] font-bold rounded uppercase transition-colors ${
                    targetLang === lang
                      ? "bg-primary-container/20 text-primary"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          {translatedText && !isLoading && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-[0.7rem] font-bold rounded">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              완료
            </span>
          )}
        </div>
        <div className="relative h-[400px] bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
          <div className="w-full h-full p-6 overflow-auto">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-outline">
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="text-sm font-medium">번역 중...</span>
                </div>
              </div>
            ) : translatedText ? (
              <pre className="text-base text-on-surface leading-relaxed whitespace-pre-wrap font-sans">
                {translatedText}
              </pre>
            ) : (
              <p className="text-base text-on-surface-variant leading-relaxed">
                번역 결과가 여기에 표시됩니다. 원문을 입력하고 번역 버튼을 눌러주세요.
              </p>
            )}
          </div>
          <div className="absolute bottom-4 right-4 flex gap-2">
            {translatedText && !isLoading && (
              <button
                onClick={handleCopy}
                className="p-2 text-outline hover:text-primary transition-colors"
                title="복사하기"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  {copied ? "check" : "content_copy"}
                </span>
              </button>
            )}
            <button
              onClick={onTranslate}
              disabled={!sourceText.trim() || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-xl hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm text-sm"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>translate</span>
              번역하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
