# Email Translator

Translate emails into English, Japanese, or Chinese using the Claude API. Supports a custom glossary stored in localStorage so specific terms are always translated consistently.

## Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

## Setup

1. **Navigate to the project directory**

   ```bash
   cd email-translator
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure your API key**

   Edit `.env.local` and replace the placeholder with your key:

   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Paste your email text into the left panel.
2. Select the target language (English / Japanese / Chinese).
3. Click **Translate**.
4. Use the **Copy** button to copy the result.

### Glossary

Expand the **Glossary** section to add term pairs (original → translation). These are saved to `localStorage` and automatically injected into every translation request so domain-specific terms are always rendered correctly.

## Build for production

```bash
npm run build
npm start
```

## Project structure

```
app/
  api/translate/route.ts   # Server-side Claude API call
  page.tsx                 # Main UI page
components/
  TranslatePanel.tsx       # Two-column source / translation view
  GlossaryManager.tsx      # Add / remove glossary entries
lib/
  glossary.ts              # localStorage helpers & prompt injection
  translate.ts             # Fetch wrapper for the translate API route
```
