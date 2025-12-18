import { z } from "zod"

// Player status in game
export const playerStatusSchema = z.object({
    name: z.string(),
    isAlive: z.boolean(),
    accusations: z.number().min(0).max(7),
    tryalCardsRevealed: z.number().min(0).max(5),
    hasBlackCat: z.boolean(),
    isWitch: z.boolean().nullable(),
    hasGavelToken: z.boolean(),
    hasConfessed: z.boolean()
})

export type PlayerStatus = z.infer<typeof playerStatusSchema>

// Game runtime state
export const salemGameStateSchema = z.object({
    currentPhase: z.enum(["setup", "first_night", "day", "night", "dawn_result", "end"]),
    roundNumber: z.number(),
    currentPlayerIndex: z.number(),
    players: z.array(playerStatusSchema),
    witchTarget: z.string().nullable(),
    constableProtected: z.string().nullable(),
    blackCatHolder: z.number(),
    witchesRevealed: z.number(),
    totalWitches: z.number(),
    confessedPlayers: z.array(z.string())
})

export type SalemGameState = z.infer<typeof salemGameStateSchema>

// Settings - No Confessor role in base game (only Constable)
export const salemSettingsSchema = z.object({
    playerCount: z.number().min(4).max(12),
    playerNames: z.array(z.string()),
    hasConstable: z.boolean(),
    beginnerMode: z.boolean(),
    notesEnabled: z.boolean()
})

export type SalemSettings = z.infer<typeof salemSettingsSchema>
