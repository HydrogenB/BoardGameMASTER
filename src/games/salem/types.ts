import type { z } from "zod"
import { salemSettingsSchema } from "./schema"

export type SalemSettings = z.infer<typeof salemSettingsSchema>

// Witch count calculation based on player count
export function getWitchCount(playerCount: number): number {
    if (playerCount <= 5) return 1
    if (playerCount <= 8) return 2
    if (playerCount <= 10) return 3
    return 4 // 11-12 players
}

export function getDefaultSalemSettings(): SalemSettings {
    return {
        playerCount: 6,
        playerNames: ["ผู้เล่น A", "ผู้เล่น B", "ผู้เล่น C", "ผู้เล่น D", "ผู้เล่น E", "ผู้เล่น F"],
        hasConstable: true,
        beginnerMode: true,
        notesEnabled: true
    }
}

// Player count options
export const SALEM_PLAYER_COUNTS = [4, 5, 6, 7, 8, 9, 10, 11, 12] as const
