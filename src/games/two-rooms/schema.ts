import { z } from "zod"

export const twoRoomsRolesSchema = z.object({
    includeGambler: z.boolean().default(false),
})

export const twoRoomsSettingsSchema = z.object({
    playerCount: z.number().min(6, "ต้องมีผู้เล่นอย่างน้อย 6 คน").max(30, "รองรับผู้เล่นสูงสุด 30 คน"),
    roundDurations: z.object({
        round1: z.number().min(60).max(300).default(180), // 3 mins
        round2: z.number().min(60).max(300).default(120), // 2 mins
        round3: z.number().min(30).max(180).default(60),  // 1 min
    }),
    hostagesPerRound: z.object({
        round1: z.number().min(1).max(5).default(2),
        round2: z.number().min(1).max(3).default(1),
        round3: z.number().min(1).max(2).default(1),
    }),
    roles: twoRoomsRolesSchema,
    features: z.object({
        checkpointsEnabled: z.boolean().default(false),
    }),
})

export type TwoRoomsSettings = z.infer<typeof twoRoomsSettingsSchema>
