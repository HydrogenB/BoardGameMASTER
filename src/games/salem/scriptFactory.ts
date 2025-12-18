import type { SalemSettings, RoleId } from "./types"
import { isRoleActive } from "./types"
import type { Phase, Step } from "@/lib/types"
import { SalemStrings } from "./strings.th"

const genId = () => crypto.randomUUID()

interface ScriptStep extends Omit<Step, 'kind'> {
    kind: "INSTRUCTION" | "CHECKPOINT"
    condition_role_exists?: RoleId
}

function filterSteps(steps: ScriptStep[], settings: SalemSettings): Step[] {
    return steps
        .filter(step => {
            if (!step.condition_role_exists) return true
            return isRoleActive(step.condition_role_exists, settings)
        })
        .map(({ condition_role_exists, ...step }) => step)
}

export function salemScriptFactory(settings: SalemSettings): Phase[] {
    const phases: Phase[] = []

    // ===== SETUP PHASE =====
    const setupSteps: ScriptStep[] = [
        { id: genId(), kind: "INSTRUCTION", text_th: "🔥 ยินดีต้อนรับสู่ Salem 1692", helper_th: "เกมล่าแม่มดในหมู่บ้าน Salem ปี 1692", can_skip: false },
        { id: genId(), kind: "INSTRUCTION", text_th: SalemStrings.SETUP.STEP1_SCRIPT, helper_th: SalemStrings.SETUP.STEP1_INSTRUCTION, can_skip: false },
        { id: genId(), kind: "INSTRUCTION", text_th: SalemStrings.SETUP.STEP2_SCRIPT, helper_th: SalemStrings.SETUP.STEP2_INSTRUCTION, can_skip: false },
        { id: genId(), kind: "INSTRUCTION", text_th: "หยิบการ์ดตามจำนวน:", helper_th: SalemStrings.SETUP.STEP3_TRYAL_TABLE(settings.playerCount) + (settings.hasConstable ? `\n\n${SalemStrings.SETUP.STEP3_CONSTABLE_NOTE}` : ""), can_skip: false },
        { id: genId(), kind: "INSTRUCTION", text_th: SalemStrings.SETUP.STEP4_SCRIPT, helper_th: SalemStrings.SETUP.STEP4_INSTRUCTION, can_skip: false },
        { id: genId(), kind: "INSTRUCTION", text_th: SalemStrings.SETUP.STEP5_PLAYING_CARDS, helper_th: SalemStrings.SETUP.STEP5_INSTRUCTION, can_skip: false },
        { id: genId(), kind: "INSTRUCTION", text_th: SalemStrings.SETUP.STEP6_DEAL_HAND, helper_th: SalemStrings.SETUP.STEP6_INSTRUCTION, can_skip: false, requires_confirm: true }
    ]
    phases.push({ id: genId(), title_th: SalemStrings.SETUP.TITLE, turnLabel: "Setup", steps: filterSteps(setupSteps, settings) })

    // ===== FIRST NIGHT (Black Cat distribution only) =====
    const firstNightSteps: ScriptStep[] = [
        { id: "fn-intro", kind: "INSTRUCTION", text_th: SalemStrings.NIGHT.INTRO_SCRIPT, helper_th: SalemStrings.NIGHT.INTRO_ACTION, can_skip: false },
        { id: "fn-close", kind: "INSTRUCTION", text_th: SalemStrings.NIGHT.CLOSE_EYES_SCRIPT, can_skip: false },
        { id: "fn-witch-wake", kind: "INSTRUCTION", text_th: `🧙‍♀️ ${SalemStrings.NIGHT.WITCH_WAKE_SCRIPT}`, helper_th: SalemStrings.NIGHT.WITCH_WAKE_ACTION, can_skip: false },
        { id: "fn-cat", kind: "INSTRUCTION", text_th: `🐈‍⬛ ${SalemStrings.NIGHT.WITCH_CAT_SCRIPT}`, helper_th: SalemStrings.NIGHT.WITCH_CAT_ACTION, can_skip: false },
        { id: "fn-witch-sleep", kind: "INSTRUCTION", text_th: `😴 ${SalemStrings.NIGHT.WITCH_SLEEP_SCRIPT}`, can_skip: false },
        { id: "fn-dawn", kind: "INSTRUCTION", text_th: `🌅 ${SalemStrings.NIGHT.DAWN_SCRIPT}`, helper_th: "ดูว่าใครได้รับ Black Cat - ผู้เล่นนั้นเริ่มเทิร์นแรก!", can_skip: false },
        { id: "fn-done", kind: "INSTRUCTION", text_th: "✅ พร้อมเริ่มเกม!", helper_th: SalemStrings.DAY.BLACK_CAT_RULE, can_skip: false, requires_confirm: true }
    ]
    phases.push({ id: genId(), title_th: "คืนแรก (First Night)", turnLabel: "คืนแรก", steps: filterSteps(firstNightSteps, settings) })

    // ===== DAY PHASE =====
    const daySteps: ScriptStep[] = [
        { id: genId(), kind: "INSTRUCTION", text_th: "🌞 เฟสกลางวัน", helper_th: SalemStrings.DAY.TURN_OPTIONS, can_skip: false },
        { id: genId(), kind: "INSTRUCTION", text_th: "กฎการกล่าวหา (Accusation)", helper_th: SalemStrings.DAY.ACCUSATION_RULE, can_skip: true },
        { id: genId(), kind: "INSTRUCTION", text_th: "ดำเนินเกมต่อ...", helper_th: "กด「Night」เมื่อจั่ว Night Card\nหรือ「Conspiracy」เมื่อจั่วเจอ", can_skip: false, requires_confirm: true }
    ]
    phases.push({ id: genId(), title_th: SalemStrings.DAY.TITLE, turnLabel: "กลางวัน", steps: filterSteps(daySteps, settings) })

    // ===== NIGHT PHASE (Full with Confession) =====
    const nightSteps: ScriptStep[] = [
        { id: "n-trigger", kind: "INSTRUCTION", text_th: SalemStrings.EVENTS.NIGHT_CARD_SCRIPT, can_skip: false },
        { id: "n-intro", kind: "INSTRUCTION", text_th: SalemStrings.NIGHT.INTRO_SCRIPT, helper_th: SalemStrings.NIGHT.INTRO_ACTION, can_skip: false },
        { id: "n-close", kind: "INSTRUCTION", text_th: SalemStrings.NIGHT.CLOSE_EYES_SCRIPT, can_skip: false },
        // Witch actions
        { id: "n-witch-wake", kind: "INSTRUCTION", text_th: `🧙‍♀️ ${SalemStrings.NIGHT.WITCH_WAKE_SCRIPT}`, helper_th: SalemStrings.NIGHT.WITCH_WAKE_ACTION, can_skip: false },
        { id: "n-witch-kill", kind: "INSTRUCTION", text_th: `💀 ${SalemStrings.NIGHT.WITCH_KILL_SCRIPT}`, helper_th: SalemStrings.NIGHT.WITCH_KILL_ACTION, can_skip: false },
        { id: "n-witch-cat", kind: "INSTRUCTION", text_th: `🐈‍⬛ ${SalemStrings.NIGHT.WITCH_CAT_SCRIPT}`, helper_th: SalemStrings.NIGHT.WITCH_CAT_ACTION, can_skip: false },
        { id: "n-witch-sleep", kind: "INSTRUCTION", text_th: `😴 ${SalemStrings.NIGHT.WITCH_SLEEP_SCRIPT}`, can_skip: false },
        // Constable (conditional)
        { id: "n-const-wake", kind: "INSTRUCTION", text_th: `👮 ${SalemStrings.NIGHT.CONSTABLE_WAKE_SCRIPT}`, condition_role_exists: "r_constable", can_skip: false },
        { id: "n-const-action", kind: "INSTRUCTION", text_th: `🛡️ ${SalemStrings.NIGHT.CONSTABLE_ACTION_SCRIPT}`, helper_th: SalemStrings.NIGHT.CONSTABLE_ACTION, condition_role_exists: "r_constable", can_skip: false },
        { id: "n-const-sleep", kind: "INSTRUCTION", text_th: `😴 ${SalemStrings.NIGHT.CONSTABLE_SLEEP_SCRIPT}`, condition_role_exists: "r_constable", can_skip: false },
        // ⭐ CONFESSION PHASE (Rulebook 3rd Edition)
        { id: "n-confess", kind: "INSTRUCTION", text_th: `⛪ ${SalemStrings.NIGHT.CONFESSION_SCRIPT}`, helper_th: SalemStrings.NIGHT.CONFESSION_ACTION, can_skip: false },
        // Dawn
        { id: "n-dawn", kind: "INSTRUCTION", text_th: `🌅 ${SalemStrings.NIGHT.DAWN_SCRIPT}`, can_skip: false },
        { id: "n-resolve", kind: "INSTRUCTION", text_th: SalemStrings.NIGHT.RESOLVE_TITLE, helper_th: SalemStrings.NIGHT.RESOLVE_INSTRUCTION, can_skip: false, requires_confirm: true }
    ]
    phases.push({ id: genId(), title_th: SalemStrings.NIGHT.TITLE, turnLabel: "กลางคืน", steps: filterSteps(nightSteps, settings) })

    // ===== CONSPIRACY EVENT (with Black Cat rule) =====
    const conspiracySteps: ScriptStep[] = [
        { id: genId(), kind: "INSTRUCTION", text_th: SalemStrings.EVENTS.CONSPIRACY_TITLE, can_skip: false },
        // ⭐ Black Cat holder must reveal first!
        { id: genId(), kind: "INSTRUCTION", text_th: SalemStrings.EVENTS.CONSPIRACY_BLACKCAT, helper_th: "ถ้ามีคนถือ Black Cat → เปิด Tryal Card 1 ใบก่อน!\nถ้าไม่มีใครถือ → ข้ามขั้นตอนนี้", can_skip: false },
        { id: genId(), kind: "INSTRUCTION", text_th: SalemStrings.EVENTS.CONSPIRACY_SCRIPT, helper_th: SalemStrings.EVENTS.CONSPIRACY_ACTION, can_skip: false, requires_confirm: true }
    ]
    phases.push({ id: genId(), title_th: "Conspiracy Event", turnLabel: "Conspiracy", steps: filterSteps(conspiracySteps, settings) })

    // ===== DEATH (Last Words) =====
    const deathSteps: ScriptStep[] = [
        { id: genId(), kind: "INSTRUCTION", text_th: SalemStrings.DEATH.REVEAL_ALL, helper_th: "ผู้ตายต้องเปิด Tryal Cards ที่เหลือทั้งหมด", can_skip: false },
        // ⭐ 3 Last Words rule
        { id: genId(), kind: "INSTRUCTION", text_th: SalemStrings.DEATH.LAST_WORDS, helper_th: SalemStrings.DEATH.SILENCE, can_skip: false, requires_confirm: true }
    ]
    phases.push({ id: genId(), title_th: "💀 ผู้เสียชีวิต", turnLabel: "Death", steps: filterSteps(deathSteps, settings) })

    // ===== END GAME =====
    const endSteps: ScriptStep[] = [
        { id: genId(), kind: "INSTRUCTION", text_th: SalemStrings.END.CHECK_WIN, helper_th: `${SalemStrings.END.TOWN_WINS}\n\n${SalemStrings.END.WITCH_WINS}`, can_skip: false },
        { id: genId(), kind: "INSTRUCTION", text_th: SalemStrings.END.REVEAL_ALL, helper_th: "ให้ทุกคนเปิด Tryal Cards ที่เหลือ", can_skip: false },
        { id: "game-end", kind: "INSTRUCTION", text_th: "🎉 ประกาศผู้ชนะ!", can_skip: false, requires_confirm: true }
    ]
    phases.push({ id: genId(), title_th: SalemStrings.END.TITLE, turnLabel: "จบเกม", steps: filterSteps(endSteps, settings) })

    return phases
}

export function getActiveRoles(settings: SalemSettings) {
    return [
        { id: "r_witch", name: "แม่มด", icon: "🧙‍♀️", active: true },
        { id: "r_constable", name: "ผู้คุม", icon: "👮", active: settings.hasConstable }
    ].filter(r => r.active)
}
