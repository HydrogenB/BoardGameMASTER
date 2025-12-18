import { z } from "zod"

export const catanSettingsSchema = z.object({
    // Party
    playerCount: z.number().min(3, "ต้องมีผู้เล่นอย่างน้อย 3 คน").max(6, "รองรับผู้เล่นสูงสุด 6 คน"),
    playerNames: z.array(z.string()).min(3).max(6),

    // Victory
    victoryPointsTarget: z.number().min(8, "คะแนนชนะต้องอยู่ระหว่าง 8-12").max(12, "คะแนนชนะต้องอยู่ระหว่าง 8-12"),

    // Board
    boardMode: z.enum(["BEGINNER", "RANDOMIZED", "MANUAL"]),
    friendlyRobberEnabled: z.boolean(),

    // Timer
    turnTimerEnabled: z.boolean(),
    turnTimerSeconds: z.number().min(60).max(180),

    // Trade Reminders
    enableTradePrompts: z.boolean(),
    enablePortReminders: z.boolean(),

    // Features
    notesEnabled: z.boolean(),
    quickTagsEnabled: z.boolean(),
    checkpointsEnabled: z.boolean(),
    checkpointFrequency: z.enum(["AFTER_ROUND", "AFTER_ROBBER"]),

    // Expansions
    expansionCitiesAndKnights: z.boolean().optional(),
    expansionSeafarers: z.boolean().optional(),
}).refine((data) => {
    return data.playerNames.length === data.playerCount
}, {
    message: "จำนวนชื่อผู้เล่นต้องตรงกับจำนวนผู้เล่น",
    path: ["playerNames"]
})

export type CatanSettingsSchema = z.infer<typeof catanSettingsSchema>
