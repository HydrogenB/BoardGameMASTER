import type { SalemSettings, RoleId } from "./types"
import { isRoleActive, SALEM_ROLES } from "./types"
import type { Phase, Step } from "@/lib/types"
import { SalemStrings } from "./strings.th"

const genId = () => crypto.randomUUID()

// Extended step with role icon for Night Mode display
interface ScriptStep extends Omit<Step, 'kind'> {
    kind: "INSTRUCTION" | "CHECKPOINT"
    role_icon?: string           // Display icon in stealth mode
    action_tag?: string          // GM action instruction
    condition_role_exists?: RoleId
}

// Filter steps based on active roles
function filterSteps(steps: ScriptStep[], settings: SalemSettings): Step[] {
    return steps
        .filter(step => {
            if (!step.condition_role_exists) return true
            return isRoleActive(step.condition_role_exists, settings)
        })
        .map(({ condition_role_exists, role_icon, action_tag, ...step }) => step)
}

export function salemScriptFactory(settings: SalemSettings): Phase[] {
    const phases: Phase[] = []

    // ===== PART 1: GAME SETUP =====
    const setupSteps: ScriptStep[] = [
        {
            id: genId(),
            kind: "INSTRUCTION",
            text_th: "🔥 ยินดีต้อนรับสู่ Salem 1692",
            helper_th: "เกมล่าแม่มดในหมู่บ้าน Salem ปี 1692",
            can_skip: false
        },
        // Phase 1.1: Town Hall Deck
        {
            id: genId(),
            kind: "INSTRUCTION",
            text_th: SalemStrings.SETUP.STEP1_SCRIPT,
            helper_th: SalemStrings.SETUP.STEP1_INSTRUCTION,
            can_skip: false
        },
        // Phase 1.2: Tryal Deck
        {
            id: genId(),
            kind: "INSTRUCTION",
            text_th: SalemStrings.SETUP.STEP2_SCRIPT,
            helper_th: SalemStrings.SETUP.STEP2_INSTRUCTION,
            can_skip: false
        },
        {
            id: genId(),
            kind: "INSTRUCTION",
            text_th: `หยิบการ์ดตามจำนวน:`,
            helper_th: SalemStrings.SETUP.STEP3_TRYAL_TABLE(settings.playerCount) +
                (settings.hasConstable ? `\n\n${SalemStrings.SETUP.STEP3_CONSTABLE_NOTE}` : ""),
            can_skip: false
        },
        {
            id: genId(),
            kind: "INSTRUCTION",
            text_th: SalemStrings.SETUP.STEP4_SCRIPT,
            helper_th: SalemStrings.SETUP.STEP4_INSTRUCTION,
            can_skip: false
        },
        {
            id: genId(),
            kind: "INSTRUCTION",
            text_th: SalemStrings.SETUP.STEP5_PLAYING_CARDS,
            helper_th: SalemStrings.SETUP.STEP5_INSTRUCTION,
            can_skip: false
        },
        {
            id: genId(),
            kind: "INSTRUCTION",
            text_th: SalemStrings.SETUP.STEP6_DEAL_HAND,
            helper_th: SalemStrings.SETUP.STEP6_INSTRUCTION,
            can_skip: false,
            requires_confirm: true
        }
    ]

    phases.push({
        id: genId(),
        title_th: SalemStrings.SETUP.TITLE,
        turnLabel: "Setup",
        steps: filterSteps(setupSteps, settings)
    })

    // ===== PART 2: FIRST NIGHT (Black Cat Distribution) =====
    const firstNightSteps: ScriptStep[] = [
        {
            id: "night-intro",
            kind: "INSTRUCTION",
            text_th: SalemStrings.NIGHT.INTRO_SCRIPT,
            helper_th: SalemStrings.NIGHT.INTRO_ACTION,
            can_skip: false
        },
        {
            id: "night-close",
            kind: "INSTRUCTION",
            text_th: SalemStrings.NIGHT.CLOSE_EYES_SCRIPT,
            can_skip: false
        },
        // Witch sequence
        {
            id: "witch-wake",
            kind: "INSTRUCTION",
            text_th: `🧙‍♀️ ${SalemStrings.NIGHT.WITCH_WAKE_SCRIPT}`,
            helper_th: SalemStrings.NIGHT.WITCH_WAKE_ACTION,
            role_icon: "🧙‍♀️",
            can_skip: false
        },
        {
            id: "witch-cat",
            kind: "INSTRUCTION",
            text_th: `🐈‍⬛ ${SalemStrings.NIGHT.WITCH_CAT_SCRIPT}`,
            helper_th: SalemStrings.NIGHT.WITCH_CAT_ACTION,
            role_icon: "🐈‍⬛",
            can_skip: false
        },
        {
            id: "witch-sleep",
            kind: "INSTRUCTION",
            text_th: `😴 ${SalemStrings.NIGHT.WITCH_SLEEP_SCRIPT}`,
            role_icon: "🧙‍♀️",
            can_skip: false
        },
        // Dawn
        {
            id: "first-dawn",
            kind: "INSTRUCTION",
            text_th: `🌅 ${SalemStrings.NIGHT.DAWN_SCRIPT}`,
            helper_th: "ดูว่าใครได้รับ Black Cat! ผู้เล่นนั้นเริ่มเทิร์นแรก",
            can_skip: false
        },
        {
            id: "first-night-done",
            kind: "INSTRUCTION",
            text_th: "✅ พร้อมเริ่มเกม!",
            helper_th: SalemStrings.DAY.BLACK_CAT_RULE,
            can_skip: false,
            requires_confirm: true
        }
    ]

    phases.push({
        id: genId(),
        title_th: "คืนแรก (First Night)",
        turnLabel: "คืนแรก",
        steps: filterSteps(firstNightSteps, settings)
    })

    // ===== DAY PHASE REFERENCE =====
    const daySteps: ScriptStep[] = [
        {
            id: genId(),
            kind: "INSTRUCTION",
            text_th: "🌞 เฟสกลางวัน",
            helper_th: SalemStrings.DAY.TURN_OPTIONS,
            can_skip: false
        },
        {
            id: genId(),
            kind: "INSTRUCTION",
            text_th: "กฎการกล่าวหา (Accusation)",
            helper_th: SalemStrings.DAY.ACCUSATION_RULE,
            can_skip: true
        },
        {
            id: genId(),
            kind: "INSTRUCTION",
            text_th: "ดำเนินเกมต่อไป...",
            helper_th: "กด 'Night Script' เมื่อจั่ว Night Card\nหรือเกิดเหตุการณ์ Conspiracy",
            can_skip: false,
            requires_confirm: true
        }
    ]

    phases.push({
        id: genId(),
        title_th: SalemStrings.DAY.TITLE,
        turnLabel: "กลางวัน",
        steps: filterSteps(daySteps, settings)
    })

    // ===== NIGHT SCRIPT (Main Night Phase) =====
    const nightSteps: ScriptStep[] = [
        {
            id: "night-trigger",
            kind: "INSTRUCTION",
            text_th: SalemStrings.EVENTS.NIGHT_CARD_SCRIPT,
            can_skip: false
        },
        {
            id: "night-intro-2",
            kind: "INSTRUCTION",
            text_th: SalemStrings.NIGHT.INTRO_SCRIPT,
            helper_th: SalemStrings.NIGHT.INTRO_ACTION,
            can_skip: false
        },
        {
            id: "night-close-2",
            kind: "INSTRUCTION",
            text_th: SalemStrings.NIGHT.CLOSE_EYES_SCRIPT,
            can_skip: false
        },
        // Witch Kill
        {
            id: "witch-wake-2",
            kind: "INSTRUCTION",
            text_th: `🧙‍♀️ ${SalemStrings.NIGHT.WITCH_WAKE_SCRIPT}`,
            helper_th: SalemStrings.NIGHT.WITCH_WAKE_ACTION,
            role_icon: "🧙‍♀️",
            can_skip: false
        },
        {
            id: "witch-kill",
            kind: "INSTRUCTION",
            text_th: `💀 ${SalemStrings.NIGHT.WITCH_KILL_SCRIPT}`,
            helper_th: SalemStrings.NIGHT.WITCH_KILL_ACTION,
            role_icon: "💀",
            can_skip: false
        },
        {
            id: "witch-cat-2",
            kind: "INSTRUCTION",
            text_th: `🐈‍⬛ ${SalemStrings.NIGHT.WITCH_CAT_SCRIPT}`,
            helper_th: SalemStrings.NIGHT.WITCH_CAT_ACTION,
            role_icon: "🐈‍⬛",
            can_skip: false
        },
        {
            id: "witch-sleep-2",
            kind: "INSTRUCTION",
            text_th: `😴 ${SalemStrings.NIGHT.WITCH_SLEEP_SCRIPT}`,
            role_icon: "🧙‍♀️",
            can_skip: false
        },
        // Constable (conditional)
        {
            id: "constable-wake",
            kind: "INSTRUCTION",
            text_th: `👮 ${SalemStrings.NIGHT.CONSTABLE_WAKE_SCRIPT}`,
            role_icon: "👮",
            condition_role_exists: "r_constable",
            can_skip: false
        },
        {
            id: "constable-action",
            kind: "INSTRUCTION",
            text_th: `🛡️ ${SalemStrings.NIGHT.CONSTABLE_ACTION_SCRIPT}`,
            helper_th: SalemStrings.NIGHT.CONSTABLE_ACTION,
            role_icon: "🛡️",
            condition_role_exists: "r_constable",
            can_skip: false
        },
        {
            id: "constable-sleep",
            kind: "INSTRUCTION",
            text_th: `😴 ${SalemStrings.NIGHT.CONSTABLE_SLEEP_SCRIPT}`,
            role_icon: "👮",
            condition_role_exists: "r_constable",
            can_skip: false
        },
        // Dawn & Resolve
        {
            id: "night-dawn",
            kind: "INSTRUCTION",
            text_th: `🌅 ${SalemStrings.NIGHT.DAWN_SCRIPT}`,
            can_skip: false
        },
        {
            id: "night-resolve",
            kind: "INSTRUCTION",
            text_th: SalemStrings.NIGHT.RESOLVE_TITLE,
            helper_th: SalemStrings.NIGHT.RESOLVE_INSTRUCTION,
            can_skip: false,
            requires_confirm: true
        }
    ]

    phases.push({
        id: genId(),
        title_th: SalemStrings.NIGHT.TITLE,
        turnLabel: "กลางคืน",
        steps: filterSteps(nightSteps, settings)
    })

    // ===== SPECIAL EVENT: CONSPIRACY =====
    const conspiracySteps: ScriptStep[] = [
        {
            id: genId(),
            kind: "INSTRUCTION",
            text_th: SalemStrings.EVENTS.CONSPIRACY_TITLE,
            can_skip: false
        },
        {
            id: genId(),
            kind: "INSTRUCTION",
            text_th: SalemStrings.EVENTS.CONSPIRACY_SCRIPT,
            helper_th: SalemStrings.EVENTS.CONSPIRACY_ACTION,
            can_skip: false,
            requires_confirm: true
        }
    ]

    phases.push({
        id: genId(),
        title_th: "Conspiracy Event",
        turnLabel: "Conspiracy",
        steps: filterSteps(conspiracySteps, settings)
    })

    // ===== END GAME =====
    const endSteps: ScriptStep[] = [
        {
            id: genId(),
            kind: "INSTRUCTION",
            text_th: SalemStrings.END.CHECK_WIN,
            helper_th: `${SalemStrings.END.TOWN_WINS}\n\n${SalemStrings.END.WITCH_WINS}`,
            can_skip: false
        },
        {
            id: genId(),
            kind: "INSTRUCTION",
            text_th: SalemStrings.END.REVEAL_ALL,
            helper_th: "ให้ทุกคนเปิด Tryal Cards ที่เหลือ",
            can_skip: false
        },
        {
            id: "game-end",
            kind: "INSTRUCTION",
            text_th: "🎉 ประกาศผู้ชนะ!",
            can_skip: false,
            requires_confirm: true
        }
    ]

    phases.push({
        id: genId(),
        title_th: SalemStrings.END.TITLE,
        turnLabel: "จบเกม",
        steps: filterSteps(endSteps, settings)
    })

    return phases
}

// Get active roles for UI display
export function getActiveRoles(settings: SalemSettings) {
    return SALEM_ROLES.filter(role => isRoleActive(role.id, settings))
}
