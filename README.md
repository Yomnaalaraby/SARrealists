This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Captain DIO game

The story-driven NISAR game is playable at `/game`. Its specification is in
[`docs/GAME_PROMPT_V2.md`](docs/GAME_PROMPT_V2.md). The landing hero also links
to it with a **Play Captain DIO** button. The current readiness and asset audit
is in [`docs/GAME_AUDIT.md`](docs/GAME_AUDIT.md).

```bash
npm run dev              # play at http://localhost:3000/game
npm run validate:content # schema, spoiler, image, source, and text checks
npm test                 # engine, content, and persistence tests
npm run typecheck        # strict TypeScript
python3 scripts/generate_game_images.py  # regenerate 160x90 mission pixel art
```

Game foundation and playable route:

- `src/game/types.ts` — domain types
- `src/game/content.ts` — zod schemas, parsing, localization, accessors
- `src/game/engine.ts` — quality tier, outcomes, crew state, endings, report
- `src/game/state.ts` — reducer and best-report persistence
- `src/game/validation.ts` — build-time content rules
- `public/game/` — `story.json`, `lenses.json`, `missions.json`,
  `reveal.json`, `facts.json`, and 22 generated pixel-art mission images
- `scripts/generate_game_images.py` — deterministic 160×90 pixel-art generator
  using the shared in-game palette
- `scripts/validate_content.ts` — CLI validator
- `src/game/art/` — palette, original sprite data, seeded 160×90 scenes, canvas components
- `src/game/components/` — cutscene, academy, briefing, crew bar, lens picker/results,
  codex, decisions, outcome, reality check, Earth reveal, report, language toggle
- `src/game/GameApp.tsx` — data loading, lazy reveal, phase router, persistence
- `src/game/i18n.ts` and `src/game/game.css` — English/Arabic UI and RTL styling
- `src/app/game/page.tsx` — the `/game` route
- `tests/` — Vitest suite, including a full four-mission playthrough

Run the production build with `npm run build && npm start` for the verified
playable route. Mission content is placeholder until real NISAR crops and sourced facts are
supplied. Pre-reveal mission data must never contain real place names,
coordinates, or place-specific source URLs; those belong in `reveal.json`.

## LUMEN AI chatbot

Every page includes a floating **Ask LUMEN** assistant. It supports four
explanation personas (Scientist, Decision Maker, Student, Enthusiast),
English/Arabic replies, citable NISAR sources, and optional map actions.
When the interactive map is available, clicking a point attaches its
coordinates and site context to the next question.

The server route is `POST /api/chat`:

- `src/app/api/chat/route.ts` — validates the request, retrieves grounded
  NISAR chunks, calls an OpenAI-compatible chat endpoint, filters map actions,
  and returns `ChatResponse`.
- `src/ai/knowledge.ts` — curated NASA/NISAR sources and deterministic
  retrieval.
- `src/ai/promptBuilder.ts` and `src/ai/personas.ts` — grounded persona prompts.
- `src/ai/fallback.ts` — local grounded answer when no API key is configured
  or the model call fails.
- `src/components/ai/ChatPanel.tsx` — the floating panel UI.
- `src/ai/components/PersonaSwitcher.tsx` — reusable persona selector.

Copy `.env.example` to `.env.local` and fill in the values:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
# Optional for OpenAI-compatible providers:
OPENAI_BASE_URL=https://api.openai.com/v1
```

`OPENAI_API_KEY` is server-only and is never exposed to the browser. Without
it, the assistant still answers from the bundled NISAR references and marks the
response as a grounded local answer.

The landing-page map is wrapped in `MapErrorBoundary`. If Mapbox cannot start
because the token is missing or invalid, the map area stays black but the rest
of the page and the LUMEN assistant remain usable.
