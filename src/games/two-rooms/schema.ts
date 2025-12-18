import { z } from "zod"

// Round configuration schema
export const roundConfigSchema = z.object({
    round_idx: z.number(),
    duration_sec: z.number().min(30).max(600),
    hostages_to_swap: z.number().min(0).max(5),
})

// Game configuration presets
export const gameConfigSchema = z.object({
    config_id: z.string(),
    rounds: z.array(roundConfigSchema),
})

// Role schema
export const roleSchema = z.object({
    role_id: z.string(),
    name: z.string(),
    name_th: z.string(),
    team: z.enum(["RED", "BLUE", "GREY", "GREEN"]),
    icon_asset: z.string().optional(),
    script_intro: z.string(),
    is_core: z.boolean(),
})

// Main settings schema
export const twoRoomsSettingsSchema = z.object({
    playerCount: z.number().min(6, "ต้องมีผู้เล่นอย่างน้อย 6 คน").max(30, "รองรับผู้เล่นสูงสุด 30 คน"),
    config: gameConfigSchema.default({
        config_id: "standard_game",
        rounds: [
            { round_idx: 1, duration_sec: 300, hostages_to_swap: 2 }, // 5 นาที
            { round_idx: 2, duration_sec: 240, hostages_to_swap: 1 }, // 4 นาที
            { round_idx: 3, duration_sec: 180, hostages_to_swap: 1 }, // 3 นาที
            { round_idx: 4, duration_sec: 120, hostages_to_swap: 1 }, // 2 นาที
            { round_idx: 5, duration_sec: 60, hostages_to_swap: 0 },  // 1 นาที (Final)
        ],
    }),
    selectedRoles: z.array(z.string()).default(["president", "bomber"]),
    features: z.object({
        soundEnabled: z.boolean().default(true),
        autoWarningAt60s: z.boolean().default(true),
        beginnerMode: z.boolean().default(true), // Show detailed helper text for new GMs
    }),
})

export type RoundConfig = z.infer<typeof roundConfigSchema>
export type GameConfig = z.infer<typeof gameConfigSchema>
export type Role = z.infer<typeof roleSchema>
export type TwoRoomsSettings = z.infer<typeof twoRoomsSettingsSchema>

// Preset configurations
export const GAME_PRESETS: Record<string, GameConfig> = {
    standard_game: {
        config_id: "standard_game",
        rounds: [
            { round_idx: 1, duration_sec: 300, hostages_to_swap: 2 },
            { round_idx: 2, duration_sec: 240, hostages_to_swap: 1 },
            { round_idx: 3, duration_sec: 180, hostages_to_swap: 1 },
            { round_idx: 4, duration_sec: 120, hostages_to_swap: 1 },
            { round_idx: 5, duration_sec: 60, hostages_to_swap: 0 },
        ],
    },
    quick_game: {
        config_id: "quick_game",
        rounds: [
            { round_idx: 1, duration_sec: 180, hostages_to_swap: 2 },
            { round_idx: 2, duration_sec: 120, hostages_to_swap: 1 },
            { round_idx: 3, duration_sec: 60, hostages_to_swap: 0 },
        ],
    },
    party_game: {
        config_id: "party_game",
        rounds: [
            { round_idx: 1, duration_sec: 240, hostages_to_swap: 3 },
            { round_idx: 2, duration_sec: 180, hostages_to_swap: 2 },
            { round_idx: 3, duration_sec: 120, hostages_to_swap: 1 },
            { round_idx: 4, duration_sec: 60, hostages_to_swap: 0 },
        ],
    },
}
