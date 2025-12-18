---
description: Debug BoardGameMASTER app issues - white screen, layout bugs, state problems
---

# Debug Workflow

Use this when the app has issues (white screen, broken layout, state problems).

## Quick Checks

// turbo-all
```bash
# Type check
npx tsc --noEmit

# Build check (catches import errors)
npx vite build
```

## Common Issues

### White Screen
1. Check imports - types need `import type`:
```typescript
import type { GameSettings } from "./types"  // ✅
import { getDefaultSettings } from "./types"  // ✅
import { GameSettings, getDefaultSettings } from "./types"  // ❌ BREAKS
```

2. Clear Vite cache:
```bash
Remove-Item -Path "node_modules/.vite" -Recurse -Force
npm run dev
```

### Footer Disappeared
- Remove wrapper div around `<RollingLyricView />`
- Must be direct child of flex container

### State Issues
- Check: `localStorage.getItem('boardgamemaster-storage')`
- Clear: `localStorage.removeItem('boardgamemaster-storage')`

## Files to Check
- Routing: `src/App.tsx`
- State: `src/state/store.ts`
- Game logic: `src/games/[game]/scriptFactory.ts`
- Play page: `src/app/[game]/play-page.tsx`
