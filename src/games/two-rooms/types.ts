// ===== GAME STATE MACHINE =====
export type GameState = "SETUP_PHASE" | "ROUND_ACTIVE" | "ROUND_END" | "GAME_OVER"

export type TeamColor = "RED" | "BLUE" | "GREY" | "GREEN"

// ===== ROLE DEFINITIONS =====
export interface RoleCard {
    role_id: string
    name: string
    name_th: string
    team: TeamColor
    icon_asset?: string
    script_intro: string
    is_core: boolean
}

// Core roles that must be in every game
export const CORE_ROLES: RoleCard[] = [
    {
        role_id: "president",
        name: "The President",
        name_th: "ประธานาธิบดี",
        team: "BLUE",
        script_intro: "คุณคือ President เป้าหมายคือต้องไม่อยู่ห้องเดียวกับ Bomber ตอนจบเกม ทีมน้ำเงินของคุณจะปกป้องคุณ!",
        is_core: true,
    },
    {
        role_id: "bomber",
        name: "The Bomber",
        name_th: "มือระเบิด",
        team: "RED",
        script_intro: "คุณคือ Bomber เป้าหมายคือต้องอยู่ห้องเดียวกับ President ตอนจบเกม ระเบิดเขาให้สำเร็จ!",
        is_core: true,
    },
]

// All available roles
export const ALL_ROLES: RoleCard[] = [
    ...CORE_ROLES,
    {
        role_id: "blue_team",
        name: "Blue Team",
        name_th: "ทีมน้ำเงิน",
        team: "BLUE",
        script_intro: "คุณอยู่ทีมน้ำเงิน ช่วยปกป้อง President และหา Bomber!",
        is_core: false,
    },
    {
        role_id: "red_team",
        name: "Red Team",
        name_th: "ทีมแดง",
        team: "RED",
        script_intro: "คุณอยู่ทีมแดง ช่วยให้ Bomber ไปอยู่ห้องเดียวกับ President!",
        is_core: false,
    },
    {
        role_id: "gambler",
        name: "The Gambler",
        name_th: "นักพนัน",
        team: "GREY",
        script_intro: "คุณเป็นกลาง! เลือกทายว่าทีมไหนจะชนะก่อนเกมจบ ถ้าทายถูกคุณก็ชนะด้วย!",
        is_core: false,
    },
    {
        role_id: "spy",
        name: "The Spy",
        name_th: "สายลับ",
        team: "GREY",
        script_intro: "คุณเป็นกลาง! คุณรู้ว่าใครเป็น President และ Bomber แต่คุณชนะถ้าอยู่ห้องเดียวกับพวกเขาทั้งคู่ตอนจบเกม!",
        is_core: false,
    },
    {
        role_id: "coy_boy",
        name: "Coy Boy",
        name_th: "คอยบอย",
        team: "GREY",
        script_intro: "คุณเป็นกลาง! คุณชอบความอาย... คุณชนะถ้าไม่มีใครเคยเห็นการ์ดของคุณตลอดทั้งเกม!",
        is_core: false,
    },
    {
        role_id: "doctor",
        name: "The Doctor",
        name_th: "หมอ",
        team: "BLUE",
        script_intro: "คุณคือหมอ! ถ้าอยู่ห้องเดียวกับ President ตอนจบเกม คุณสามารถช่วยรักษา President จากระเบิดได้!",
        is_core: false,
    },
    {
        role_id: "engineer",
        name: "The Engineer",
        name_th: "วิศวกร",
        team: "RED",
        script_intro: "คุณคือวิศวกร! ถ้าอยู่ห้องเดียวกับ Bomber ตอนจบเกม ระเบิดจะระเบิดทั้ง 2 ห้อง!",
        is_core: false,
    },
]

// ===== GAME STATE INTERFACE =====
export interface TwoRoomsGameState {
    currentState: GameState
    currentRoundIndex: number
    timeRemaining: number // seconds
    isPaused: boolean
    totalRounds: number
}

// ===== SETTINGS INTERFACE =====
export interface TwoRoomsSettings {
    playerCount: number
    config: {
        config_id: string
        rounds: Array<{
            round_idx: number
            duration_sec: number
            hostages_to_swap: number
        }>
    }
    selectedRoles: string[]
    features: {
        soundEnabled: boolean
        autoWarningAt60s: boolean
    }
}

// ===== AUDIO EVENTS =====
export type AudioEvent =
    | "WHISTLE"          // Manual: นกหวีด
    | "WARNING_60S"      // Auto: เตือน 1 นาทีสุดท้าย
    | "BUZZER_END"       // Auto: หมดเวลา
    | "BOMB_EXPLODE"     // Manual/Final: ระเบิด!
    | "VICTORY_FANFARE"  // Final: ชนะ!
