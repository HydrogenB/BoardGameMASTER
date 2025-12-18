import { z } from "zod"

export const werewolfRolesSchema = z.object({
    wolves: z.number().min(1, "ต้องมีหมาป่าอย่างน้อย 1 ตัว"),
    villagers: z.number().min(0),
    seer: z.number().min(0),
    witch: z.number().min(0),
    guard: z.number().min(0),
})

export const werewolfRulesSchema = z.object({
    revealRoleOnDeath: z.boolean(),
    lastWordsEnabled: z.boolean(),
    discussionTimerEnabled: z.boolean(),
    discussionMinutes: z.number().min(1).max(15).optional(),
    witchCanSaveSelf: z.boolean().optional(),
    witchOneActionPerNight: z.boolean().optional(),
})

export const werewolfSettingsSchema = z.object({
    numberOfPlayers: z.number().min(5, "ผู้เล่นต้องมี 5-20 คน").max(20, "ผู้เล่นต้องมี 5-20 คน"),
    preset: z.enum(["classic", "witch", "guard", "custom"]),
    roles: werewolfRolesSchema,
    rules: werewolfRulesSchema,
    features: z.object({
        notesEnabled: z.boolean(),
        quickTagsEnabled: z.boolean(),
        checkpointsEnabled: z.boolean(),
        checkpointFrequency: z.enum(["EVERY_TURN", "DAY_ONLY"]).default("EVERY_TURN"),
    })
}).refine((data) => {
    const totalRoles = Object.values(data.roles).reduce((a, b) => a + b, 0)
    return totalRoles === data.numberOfPlayers
}, {
    message: "จำนวนบทบาทรวมต้องเท่ากับจำนวนผู้เล่น",
    path: ["roles"] // Point validation error to roles field
})

export type WerewolfRoles = z.infer<typeof werewolfRolesSchema>
export type WerewolfSettings = z.infer<typeof werewolfSettingsSchema>
