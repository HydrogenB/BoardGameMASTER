---
description: Add a new game to BoardGameMASTER (like werewolf, catan pattern)
---

# Add New Game Workflow

## Steps

### 1. Add GameId to types
Edit `src/lib/types.ts`:
```typescript
export type GameId = "werewolf" | "catan" | "two-rooms" | "NEW_GAME"
```

Edit `src/state/store.ts` lastSettings:
```typescript
lastSettings: {
    werewolf: {},
    catan: {},
    "two-rooms": {},
    "NEW_GAME": {}
}
```

### 2. Create game folder
Create `src/games/[game-name]/` with:
- `types.ts` - Settings interface + `getDefaultSettings()`
- `scriptFactory.ts` - Generates `Phase[]` for gameplay
- `strings.th.ts` - Thai localization strings
- `schema.ts` - Zod validation (optional)

### 3. Create pages
Create `src/app/[game-name]/`:
- `setup-page.tsx` - Settings form
- `play-page.tsx` - Main gameplay
- `summary-page.tsx` - End game summary

### 4. Register routes
Edit `src/App.tsx`:
```tsx
<Route path="/game/setup" element={<GameSetupPage />} />
<Route path="/game/play" element={<GamePlayPage />} />
<Route path="/game/summary" element={<GameSummaryPage />} />
```

### 5. Add to landing page
Edit `src/app/landing-page.tsx` - add game card

## Reference Files
- Copy from: `src/games/werewolf/` or `src/games/catan/`
- Pages: `src/app/werewolf/` or `src/app/catan/`
