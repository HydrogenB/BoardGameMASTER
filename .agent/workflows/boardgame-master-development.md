---
description: 
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
│   ├── checkpoint-step.tsx
│   └── countdown-timer.tsx
├── state/
│   └── store.ts            # Zustand global state
└── lib/
    ├── types.ts            # Shared types (Phase, Step, etc.)
    └── utils.ts
```

---

## Core Types (`src/lib/types.ts`)

### GameId
```typescript
export type GameId = "werewolf" | "catan" | "two-rooms"
// Add new games here
```

### Step - Individual instruction in gameplay
```typescript
export interface Step {
    id: string              // Unique ID like "setup-1"
    kind: "INSTRUCTION" | "CHECKPOINT"
    text_th: string         // Main display text (Thai)
    helper_th?: string      // Secondary helper text
    can_skip: boolean       // Allow skipping
    timerSeconds?: number   // Show countdown timer if set
}
```

### Phase - A group of steps
```typescript
export interface Phase {
    id: string
    title_th: string        // Phase title
    turnLabel: string       // e.g., "คืนที่ 1", "รอบ 3"
    steps: Step[]
}
```

### SessionState - Complete game session
```typescript
export interface SessionState<TSettings = any> {
    sessionId: string
    gameId: GameId
    createdAt: string
    updatedAt: string
    status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED"
    settings: TSettings     // Game-specific settings
    
    // Progress tracking
    phaseIndex: number
    stepIndex: number
    completedStepIds: string[]
    
    // User data
    notes: Note[]
    checkpoints: Checkpoint[]
}
```

---

## Shared Components

### RollingLyricView
**File**: `src/components/rolling-lyric-view.tsx`

**Purpose**: Main gameplay display showing karaoke-style scrolling steps with focus on active step.

**Props**:
```typescript
interface RollingLyricViewProps {
    steps: ExtendedStep[]           // Steps with phaseIndex, stepIndex, turnLabel
    activeIndex: number             // Currently active step
    onStepClick: (index: number) => void
    onCheckpointSave?: (checkpoint: Checkpoint) => void
    onCheckpointSkip?: () => void
}
```

**Usage in play-page.tsx**:
```tsx
// ⚠️ IMPORTANT: Do NOT wrap in extra div - causes footer to disappear!
<RollingLyricView
    steps={allSteps}
    activeIndex={currentGlobalIndex}
    onStepClick={handleStepClick}
    onCheckpointSave={handleCheckpointSave}
    onCheckpointSkip={handleCheckpointSkip}
/>
```

**Features**:
- Auto-scrolls to active step
- Shows CheckpointStep for CHECKPOINT kind
- Shows CountdownTimer if step has timerSeconds
- Shows helper_th when step is active

---

### NotesSheet
**File**: `src/components/notes-sheet.tsx`

**Purpose**: Bottom sheet modal for adding notes during gameplay.

**Props**:
```typescript
interface NotesSheetProps {
    onClose: () => void
    currentCtx: {
        phaseId: string         // Current phase ID
        stepId: string          // Current step ID
        turnLabel: string       // e.g., "คืนที่ 1"
    }
}
```

**Usage**:
```tsx
const [notesOpen, setNotesOpen] = useState(false)

// In footer
<Button onClick={() => setNotesOpen(true)}>
    <NotebookPen />
</Button>

// Render conditionally
{notesOpen && session && activeStep && (
    <NotesSheet
        onClose={() => setNotesOpen(false)}
        currentCtx={{
            phaseId: session.phaseIndex.toString(),
            stepId: activeStep.id,
            turnLabel: activeStep.turnLabel || "Unknown"
        }}
    />
)}
```

---

### CountdownTimer
**File**: `src/components/countdown-timer.tsx`

**Purpose**: Countdown timer with play/pause/reset controls.

**Props**:
```typescript
interface CountdownTimerProps {
    initialSeconds: number      // Starting time
    autoStart?: boolean         // Start immediately (default: false)
    onFinish?: () => void       // Callback when timer hits 0
}
```

**Auto-shown by RollingLyricView** when step has `timerSeconds > 0`.

---

### CheckpointStep
**File**: `src/components/checkpoint-step.tsx`

**Purpose**: Rating/save checkpoint during gameplay (for reflection at game end).

**Props**:
```typescript
interface CheckpointStepProps {
    stepId: string
    phaseId: string
    turnLabel: string
    onSave: (checkpoint: Checkpoint) => void
    onSkip: () => void
}
```

**Auto-rendered by RollingLyricView** when step kind is "CHECKPOINT".

---

## State Management (`src/state/store.ts`)

### Access Store
```typescript
import { useAppStore } from "@/state/store"
```

### Key Actions
```typescript
// Create new game session
const createSession = useAppStore(state => state.createSession)
createSession("catan", settings)  // Navigates and sets activeSessionId

// Resume existing session
const resumeSession = useAppStore(state => state.resumeSession)
resumeSession(sessionId)

// Get current session
const session = useAppStore(state => 
    state.activeSessionId ? state.sessions[state.activeSessionId] : null
)

// Update session progress
const updateSession = useAppStore(state => state.updateSession)
updateSession(sessionId, s => {
    s.phaseIndex = newPhaseIndex
    s.stepIndex = newStepIndex
})

// Add note
const addNote = useAppStore(state => state.addNote)
addNote({ id: "...", text: "...", ... })

// Mark step complete
const markStepComplete = useAppStore(state => state.markStepComplete)
markStepComplete(stepId)
```

---

## Adding a New Game

### 1. Add GameId
Update `src/lib/types.ts`:
```typescript
export type GameId = "werewolf" | "catan" | "two-rooms" | "new-game"
```

Update `src/state/store.ts` lastSettings:
```typescript
lastSettings: {
    werewolf: {},
    catan: {},
    "two-rooms": {},
    "new-game": {}  // Add here
}
```

### 2. Create Game Logic (`src/games/[game-name]/`)

**types.ts**:
```typescript
export interface GameSettings {
    playerCount: number
    playerNames: string[]
    // game-specific options...
}

export function getDefaultSettings(): GameSettings {
    return {
        playerCount: 4,
        playerNames: ["ผู้เล่น A", "ผู้เล่น B", ...]
    }
}
```

**scriptFactory.ts**:
```typescript
import type { Phase, Step } from "@/lib/types"
import type { GameSettings } from "./types"
import { GameStrings } from "./strings.th"

export function gameScriptFactory(settings: GameSettings): Phase[] {
    const phases: Phase[] = []
    
    // Setup phase
    phases.push({
        id: "setup",
        title_th: "เตรียมเกม",
        turnLabel: "เตรียมเกม",
        steps: [
            { id: "setup-1", kind: "INSTRUCTION", text_th: "...", can_skip: false },
            // ...
        ]
    })
    
    // Game turns...
    
    return phases
}
```

**strings.th.ts**:
```typescript
export const GameStrings = {
    SETUP: {
        WELCOME: "ยินดีต้อนรับสู่เกม...",
        // ...
    },
    UI: {
        START_GAME: "เริ่มเกม",
        DONE: "ทำเสร็จแล้ว",
        // ...
    }
}
```

### 3. Create Pages (`src/app/[game-name]/`)

**setup-page.tsx** - Settings form:
```tsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import type { GameSettings } from "@/games/game/types"
import { getDefaultSettings } from "@/games/game/types"

export function GameSetupPage() {
    const navigate = useNavigate()
    const createSession = useAppStore(state => state.createSession)
    const [settings, setSettings] = useState<GameSettings>(getDefaultSettings())
    
    const handleStart = () => {
        createSession("game-id", settings)
        navigate("/game/play")
    }
    
    // Settings form UI...
}
```

**play-page.tsx** - Main gameplay:
```tsx
export function GamePlayPage() {
    const navigate = useNavigate()
    const session = useAppStore(state => 
        state.activeSessionId ? state.sessions[state.activeSessionId] : null
    )
    const updateSession = useAppStore(state => state.updateSession)
    const markStepComplete = useAppStore(state => state.markStepComplete)
    
    // Generate phases from settings
    const { allSteps } = useMemo(() => {
        if (!session) return { allSteps: [] }
        const phases = gameScriptFactory(session.settings)
        // Flatten to allSteps with phaseIndex, stepIndex, turnLabel
    }, [session?.settings])
    
    // Handle step progression...
    
    return (
        <div className="h-screen w-full flex flex-col bg-background fixed inset-0">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur z-10">
                ...
            </header>
            
            {/* ⚠️ NO WRAPPER DIV - directly use RollingLyricView */}
            <RollingLyricView ... />
            
            {/* Footer - MUST MATCH THIS LAYOUT */}
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
        </div>
    )
}
```

### 4. Register Routes (`src/App.tsx`)
```tsx
import { GameSetupPage } from "@/app/game/setup-page"
import { GamePlayPage } from "@/app/game/play-page"
import { GameSummaryPage } from "@/app/game/summary-page"

// Add routes
<Route path="/game/setup" element={<GameSetupPage />} />
<Route path="/game/play" element={<GamePlayPage />} />
<Route path="/game/summary" element={<GameSummaryPage />} />
```

### 5. Add to Landing Page
Update `src/app/landing-page.tsx` with game card.

