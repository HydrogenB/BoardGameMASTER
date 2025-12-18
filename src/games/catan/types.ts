// Catan Game Types

export type BoardMode = "BEGINNER" | "RANDOMIZED" | "MANUAL"

export type CatanPhaseKey =
    | "SETUP"
    | "PLACEMENT_R1"
    | "PLACEMENT_R2"
    | "TURN_LOOP"
    | "ROBBER"

export type CheckpointFrequency = "AFTER_ROUND" | "AFTER_ROBBER"

export interface CatanSettings {
    // Party
    playerCount: 3 | 4 | 5 | 6
    playerNames: string[]

    // Victory
    victoryPointsTarget: number // 8-12, default 10

    // Board
    boardMode: BoardMode
    friendlyRobberEnabled: boolean // house rule

    // Timer
    turnTimerEnabled: boolean
    turnTimerSeconds: number // 60-180, default 120

    // Trade Reminders
    enableTradePrompts: boolean
    enablePortReminders: boolean

    // Features
    notesEnabled: boolean
    quickTagsEnabled: boolean
    checkpointsEnabled: boolean
    checkpointFrequency: CheckpointFrequency

    // Expansions (for future / existing dice roller)
    expansionCitiesAndKnights?: boolean
    expansionSeafarers?: boolean
}

export interface CatanRuntime {
    phaseKey: CatanPhaseKey
    currentPlayerIndex: number
    roundNumber: number
    lastDiceRoll?: number
    // For robber subflow - track where to return
    returnToStepIndex?: number
    robberPending?: boolean
}

export interface RollResult {
    die1: number
    die2: number
    sum: number
    timestamp: number
    eventId?: "robber"
    eventDie?: "barbarian" | "gate_yellow" | "gate_blue" | "gate_green" | "gate"
}

// Default settings factory
export function getDefaultCatanSettings(): CatanSettings {
    return {
        playerCount: 4,
        playerNames: ["ผู้เล่น A", "ผู้เล่น B", "ผู้เล่น C", "ผู้เล่น D"],
        victoryPointsTarget: 10,
        boardMode: "BEGINNER",
        friendlyRobberEnabled: false,
        turnTimerEnabled: false,
        turnTimerSeconds: 120,
        enableTradePrompts: true,
        enablePortReminders: true,
        notesEnabled: true,
        quickTagsEnabled: true,
        checkpointsEnabled: true,
        checkpointFrequency: "AFTER_ROUND",
        expansionCitiesAndKnights: false,
        expansionSeafarers: false,
    }
}

// Quick tags for Catan notes
export const CATAN_QUICK_TAGS = [
    "ของเยอะ",
    "ขาด brick",
    "ขาด ore",
    "เน้น dev card",
    "ล่า longest road",
    "ล่า largest army",
    "สงสัยถือ wheat",
    "ใกล้ชนะ",
]
