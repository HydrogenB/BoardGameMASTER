export type GameId = "werewolf" | "catan" | "two-rooms" | "salem"

export type GameStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED"

export interface Note {
    id: string
    text: string
    playerLabel?: string
    tags: string[]
    createdAt: string // ISO string
    phaseId: string
    stepId: string
    turnLabel: string
}

export interface Checkpoint {
    id: string
    rating: number // 1-5
    note?: string
    createdAt: string
    phaseId: string
    turnLabel: string
}

export type StepKind = "INSTRUCTION" | "CHECKPOINT"

export interface Step {
    id: string
    kind: StepKind
    text_th: string
    helper_th?: string
    can_skip: boolean
    requires_confirm?: boolean
    timerSeconds?: number
}

export interface Phase {
    id: string
    title_th: string
    turnLabel: string // e.g., "คืนที่ 1", "กลางวัน 1"
    steps: Step[]
}

export interface SessionState<TSettings = any> {
    sessionId: string
    gameId: GameId
    createdAt: string
    updatedAt: string
    status: GameStatus
    settings: TSettings

    // Progress
    phaseIndex: number
    stepIndex: number
    completedStepIds: string[]

    // Data
    notes: Note[]
    checkpoints: Checkpoint[]

    // Technical
    _version: number
}
