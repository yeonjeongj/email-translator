# 메일 번역 (Email Translator)

A Next.js app for translating business emails using the Claude API. Supports Korean, English, Japanese, and Chinese. Translations are saved per company and thread in Supabase, with AI-generated summaries, milestone tracking, and reply drafting.

## Features

- **Translation** — Paste an inbound email and translate it to KO / EN / JA / ZH
- **Reply drafting** — Write an outbound reply in Korean and translate it; use AI to auto-generate a draft based on thread history or add formal opening/closing phrases
- **Thread management** — Organize translations by company and project thread; the app remembers your last active thread
- **AI summary** — Each thread gets an auto-updated one-liner summary, topic tags, action items, and status (ongoing / pending / done) every time you save
- **Milestones** — Record key agreements on a thread; milestones never expire
- **Glossary** — Global term pairs (source → target) injected into every translation prompt for consistent domain terminology
- **History page** — Three-column archive view (companies → threads → detail) with message log and milestone timeline

## Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)
- A [Supabase](https://supabase.com/) project with the schema described below

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create `.env.local` with:

   ```
   ANTHROPIC_API_KEY=sk-ant-...
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   ```

3. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Supabase schema

The app requires the following tables (all rows are user-scoped via `user_id`):

| Table            | Key columns                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `companies`      | `id`, `user_id`, `name`, `default_lang`, `created_at`                                               |
| `threads`        | `id`, `user_id`, `company_id`, `title`, `summary` (jsonb), `created_at`                             |
| `messages`       | `id`, `user_id`, `thread_id`, `direction`, `original_text`, `translated_text`, `lang`, `created_at` |
| `milestones`     | `id`, `user_id`, `thread_id`, `title`, `content`, `created_at`                                      |
| `glossary_items` | `id`, `user_id`, `source`, `target`, `created_at`                                                   |
| `user_profiles`  | `user_id`, `last_company_id`, `last_thread_id`                                                      |

The following foreign key constraints with `ON DELETE CASCADE` are required (used by `deleteCompany` and `deleteThread` to clean up child rows automatically):

| Foreign key            | References     | Behavior                                     |
| ---------------------- | -------------- | -------------------------------------------- |
| `threads.company_id`   | `companies.id` | Deleting a company removes all its threads   |
| `messages.thread_id`   | `threads.id`   | Deleting a thread removes all its messages   |
| `milestones.thread_id` | `threads.id`   | Deleting a thread removes all its milestones |

The `messages` table requires a `trg_enforce_message_cap` trigger that caps each thread at 10 messages (deletes the oldest when exceeded).

A stored procedure `get_thread_counts()` must return `{ company_id, count }` rows for the history sidebar.

Authentication uses Supabase Auth with the OAuth callback at `/auth/callback`.

## Usage

### Translation page (`/`)

1. Paste an inbound email into the left panel.
2. Select the target language.
3. Click **Translate**.
4. Optionally expand **답장 작성 (Reply)** to compose an outbound reply:
   - **히스토리 기반 초안 작성** — generates a draft using the thread's AI summary
   - **서문 & 마무리 추가** — wraps your reply body with context-aware opening and closing phrases
5. Click **저장하기** to save to the active thread (or choose a company/thread in the modal).
6. Click **마일스톤 저장** to record a key agreement for the active thread.

### Glossary

Expand **Glossary** at the bottom of the page to add term pairs. These are stored in Supabase and injected into every translation request.

### History page (`/history`)

Browse saved threads by company. Each thread shows an AI summary, metadata, milestone timeline, and the last 10 messages.

## Build for production

```bash
npm run build
npm start
```

## Project structure

```
app/
  api/
    translate/route.ts        # Claude translation
    summarize/route.ts        # Claude thread summary generation
    draft-reply/route.ts      # Claude reply draft from thread history
    reply-formalities/route.ts# Claude opening/closing phrase injection
    milestone/route.ts        # Claude milestone title/content extraction
  auth/callback/route.ts      # Supabase OAuth callback
  page.tsx                    # Translation page
  history/page.tsx            # History archive page
  layout.tsx

components/
  TranslatePanel.tsx          # Two-column source / translation view
  GlossaryManager.tsx         # Add / remove glossary entries
  SaveModal.tsx               # Company + thread picker on first save
  ChangeModal.tsx             # Switch active company / thread
  AuthGate.tsx                # Auth guard wrapper

lib/
  types.ts                    # Shared types (Company, Thread, Message, etc.)
  storage.ts                  # Supabase CRUD helpers
  translate.ts                # Fetch wrapper for /api/translate
  glossary.ts                 # Glossary prompt builder
  supabase/
    client.ts                 # Browser Supabase client
    server.ts                 # Server-side Supabase client
```
