# BoardGameMASTER Design System

## Tech Stack
- **React 19** + TypeScript + Vite
- **TailwindCSS** + **shadcn/ui** components
- **Zustand** (state) + **React Router v7** (routing)
- **Framer Motion** (animations)

---

## Project Structure
```
src/
├── app/                    # Pages per game
│   ├── landing-page.tsx
│   ├── component-demo.tsx  # Component showcase at /component-demo
│   ├── werewolf/
│   ├── catan/
│   └── [game]/
│       ├── setup-page.tsx
│       ├── play-page.tsx
│       └── summary-page.tsx
├── games/                  # Game logic
│   └── [game]/
│       ├── types.ts
│       ├── scriptFactory.ts
│       ├── strings.th.ts
│       └── schema.ts
├── components/
│   ├── ui/                 # shadcn base components
│   ├── rolling-lyric-view.tsx
│   ├── notes-sheet.tsx
│   ├── countdown-timer.tsx
│   └── checkpoint-step.tsx
├── state/store.ts
└── lib/types.ts
```

---

## Core Types

```typescript
// Step - Single instruction
interface Step {
    id: string
    kind: "INSTRUCTION" | "CHECKPOINT"
    text_th: string
    helper_th?: string
    can_skip: boolean
    timerSeconds?: number
}

// Phase - Group of steps
interface Phase {
    id: string
    title_th: string
    turnLabel: string
    steps: Step[]
}

// GameId - Add new games here
type GameId = "werewolf" | "catan" | "two-rooms"
```

---

## Components Reference

### RollingLyricView
**Purpose**: Main gameplay UI - karaoke-style scrolling steps
```tsx
<RollingLyricView
    steps={allSteps}                    // ExtendedStep[]
    activeIndex={currentIndex}          // number
    onStepClick={handleClick}           // (index) => void
    onCheckpointSave={handleSave}       // (Checkpoint) => void
    onCheckpointSkip={handleSkip}       // () => void
/>
```
⚠️ **CRITICAL**: Do NOT wrap in extra div - causes footer to disappear!

### CountdownTimer
**Purpose**: Timer with play/pause/reset
```tsx
<CountdownTimer
    initialSeconds={180}
    autoStart={false}
    onFinish={() => alert("Done!")}
/>
```

### NotesSheet
**Purpose**: Bottom sheet for adding notes
```tsx
{notesOpen && (
    <NotesSheet
        onClose={() => setNotesOpen(false)}
        currentCtx={{ phaseId, stepId, turnLabel }}
    />
)}
```

### CheckpointStep
**Purpose**: Save game checkpoint/rating
```tsx
<CheckpointStep
    stepId="s1" phaseId="p1" turnLabel="Turn 1"
    onSave={(cp) => {}} onSkip={() => {}}
/>
```

---

## Page Templates

### Setup Page Pattern
```tsx
export function GameSetupPage() {
    const navigate = useNavigate()
    const createSession = useAppStore(s => s.createSession)
    const [settings, setSettings] = useState(getDefaultSettings())

    const handleStart = () => {
        createSession("game-id", settings)
        navigate("/game/play")
    }

    return (
        <div className="container mx-auto max-w-lg p-4 space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                    <ChevronLeft />
                </Button>
                <h1 className="text-2xl font-bold">ตั้งค่าเกม</h1>
            </div>
            {/* Settings cards... */}
            <Button onClick={handleStart} className="w-full">เริ่มเกม</Button>
        </div>
    )
}
```

### Play Page Pattern
```tsx
export function GamePlayPage() {
    return (
        <div className="h-screen w-full flex flex-col bg-background fixed inset-0">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur z-10">
                ...
            </header>

            {/* ⚠️ NO WRAPPER - direct child */}
            <RollingLyricView ... />

            {/* Footer - MUST MATCH */}
            <div className="p-4 pb-8 border-t bg-background/95 backdrop-blur z-10 flex gap-4 items-center justify-between">
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-full">
                    <ChevronLeft />
                </Button>
                <div className="flex-1 flex gap-2 justify-center">
                    <Button className="h-14 flex-1 rounded-full text-lg shadow-lg">
                        <Check className="mr-2 h-6 w-6" /> ทำเสร็จแล้ว
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

---

## Styling Tokens

### Colors (use Tailwind theme classes)
```
bg-background          # Main background
bg-background/95       # Header/footer with transparency
text-primary           # Primary text
text-muted-foreground  # Secondary text
border-border          # Borders
```

### Spacing
```
p-4                    # Standard padding
gap-4                  # Standard gap
pb-8                   # Bottom padding for safe area
rounded-full           # Circular buttons
rounded-xl             # Cards
```

### Buttons
```tsx
// Primary action
<Button className="h-14 flex-1 rounded-full text-lg shadow-lg">

// Icon button
<Button variant="outline" size="icon" className="h-14 w-14 rounded-full">

// Secondary icon
<Button variant="secondary" size="icon" className="h-12 w-12 rounded-full">
```

---

## State Management

```typescript
import { useAppStore } from "@/state/store"

// Create session
const createSession = useAppStore(s => s.createSession)
createSession("game-id", settings)

// Get session
const session = useAppStore(s => 
    s.activeSessionId ? s.sessions[s.activeSessionId] : null
)

// Update progress
const updateSession = useAppStore(s => s.updateSession)
updateSession(id, s => { s.phaseIndex = 1 })

// Notes & checkpoints
const addNote = useAppStore(s => s.addNote)
const addCheckpoint = useAppStore(s => s.addCheckpoint)
```

---

## Critical Rules

### 1. Type Imports (Prevents white screen)
```typescript
// ✅ CORRECT
import type { GameSettings } from "./types"
import { getDefaultSettings } from "./types"

// ❌ WRONG - breaks Vite
import { GameSettings, getDefaultSettings } from "./types"
```

### 2. RollingLyricView Layout
```tsx
// ✅ CORRECT - direct child
<div className="flex flex-col">
    <RollingLyricView ... />
    <footer>...</footer>
</div>

// ❌ WRONG - footer disappears
<div className="flex flex-col">
    <div className="flex-1">
        <RollingLyricView ... />
    </div>
    <footer>...</footer>
</div>
```

### 3. Theme Classes
Always use theme classes, not hardcoded colors:
- `bg-background` not `bg-black`
- `text-primary` not `text-white`

---

## Commands

// turbo-all
```bash
npm run dev      # Dev server
npm run build    # Production build  
npx tsc --noEmit # Type check
```

---

## Demo Page
Visit `/component-demo` to see all components in action.
