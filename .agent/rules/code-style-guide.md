---
trigger: always_on
---

# BoardGameMASTER Development Guide

## Project Overview
A React web app for board game facilitation (Game Master helper). Built with:
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS + shadcn/ui components
- **State**: Zustand with persist middleware
- **Routing**: React Router DOM v7

## Project Structure

```
src/
├── app/                    # Page components per game
│   ├── landing-page.tsx    # Homepage with game selection
│   ├── werewolf/           # Game-specific pages
│   │   ├── setup-page.tsx
│   │   ├── play-page.tsx
│   │   └── summary-page.tsx
│   ├── catan/
│   └── [new-game]/         # Follow same pattern
├── games/                  # Game logic & data
│   ├── werewolf/
│   │   ├── types.ts        # Settings & runtime types
│   │   ├── schema.ts       # Zod validation
│   │   ├── scriptFactory.ts # Generates Phase[] for play
│   │   └── strings.th.ts   # Thai localization
│   ├── catan/
│   └── [new-game]/
├── components/             # Shared UI components
│   ├── ui/                 # shadcn components
│   ├── rolling-lyric-view.tsx
│   ├── notes-sheet.tsx
│   └── checkpoint-step.tsx
├── state/
│   └── store.ts            # Zustand global state
└── lib/
    ├── types.ts            # Shared types (Phase, Step, etc.)
    └── utils.ts
```

## Adding a New Game

### 1. Create Game Logic (`src/games/[game-name]/`)
```typescript
// types.ts - Settings interface
export interface GameSettings {
    playerCount: number
    playerNames: string[]
    // game-specific options...
}
export function getDefaultSettings(): GameSettings { ... }

// scriptFactory.ts - Generate play script
export function gameScriptFactory(settings: GameSettings): Phase[] {
    // Return array of phases with steps
}

// strings.th.ts - Thai strings
export const GameStrings = { ... }
```

### 2. Create Pages (`src/app/[game-name]/`)
- **setup-page.tsx**: Settings form → calls `createSession()` → navigates to play
- **play-page.tsx**: Uses `RollingLyricView` for step display + footer with back/done/notes
- **summary-page.tsx**: Game recap with notes and stats

### 3. Register Routes (`src/App.tsx`)
```tsx
import { GameSetupPage } from "@/app/[game]/setup-page"
// Add routes:
<Route path="/[game]/setup" element={<GameSetupPage />} />
<Route path="/[game]/play" element={<GamePlayPage />} />
```

### 4. Add to Landing Page
Update `src/app/landing-page.tsx` with game card

## Key Patterns

### Play Page Footer (MUST MATCH)
```tsx
<div className="p-4 pb-8 border-t bg-background/95 backdrop-blur z-10 flex gap-4 items-center justify-between">
    <Button variant="outline" size="icon" onClick={handleBack} className="h-14 w-14 rounded-full">
        <ChevronLeft />
    </Button>
    <div className="flex-1 flex gap-2 justify-center">
        <Button className="h-14 flex-1 rounded-full text-lg shadow-lg" onClick={handleMarkDone}>
            <Check className="mr-2 h-6 w-6" />
            ทำเสร็จแล้ว
        </Button>
    </div>
    <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full">
        <NotebookPen className="h-5 w-5" />
    </Button>
</div>
```

### RollingLyricView (Don't wrap in extra div!)
```tsx
// CORRECT:
<RollingLyricView steps={...} activeIndex={...} ... />

// WRONG (causes footer to disappear):
<div className="flex-1">
    <RollingLyricView ... />
</div>
```

### Type Imports (IMPORTANT)
Use `import type` for type-only imports to avoid Vite ESM issues:
```typescript
import type { GameSettings, BoardMode } from "@/games/game/types"
import { getDefaultSettings } from "@/games/game/types"
```

### Theme Classes
- Container: `bg-background`
- Header/Footer: `bg-background/95 backdrop-blur`
- Use `text-primary`, `text-muted-foreground`, not hardcoded colors

## Commands

// turbo-all
```bash
npm run dev      # Start dev server
npm run build    # Production build
npx tsc --noEmit # Type check only
```

## State Management
```typescript
// Create session
const createSession = useAppStore(state => state.createSession)
createSession("game-id", settings)

// Read session
const session = useAppStore(state => state.sessions[state.activeSessionId])

// Update progress
const updateSession = useAppStore(state => state.updateSession)
updateSession(sessionId, s => { s.phaseIndex = n; s.stepIndex = m })
```
