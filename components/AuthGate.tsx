"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  // undefined = still checking session
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSendMagicLink() {
    if (!email.trim()) return;
    setIsSubmitting(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setIsSubmitting(false);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  }

  // Loading — checking session
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in — show magic link form
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4 space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-on-surface">메일 번역</h1>
            <p className="text-sm text-outline">
              이메일로 로그인하세요. 비밀번호가 필요 없습니다.
            </p>
          </div>

          {sent ? (
            <div className="text-sm text-on-surface-variant bg-surface-container-low rounded-xl p-4 space-y-1">
              <p className="font-semibold text-on-surface">이메일을 확인하세요.</p>
              <p>
                <span className="font-medium">{email}</span>으로 로그인 링크를
                보냈습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMagicLink()}
                placeholder="your@email.com"
                className="w-full border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface bg-surface-container-low focus:outline-none focus:border-primary placeholder:text-outline/60"
                autoFocus
              />
              {error && <p className="text-xs text-error">{error}</p>}
              <button
                onClick={handleSendMagicLink}
                disabled={!email.trim() || isSubmitting}
                className="w-full py-2.5 bg-primary text-white font-semibold rounded-xl hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
              >
                {isSubmitting ? "전송 중..." : "로그인 링크 보내기"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
