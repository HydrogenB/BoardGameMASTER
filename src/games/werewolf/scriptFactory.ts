import type { WerewolfSettings } from "./schema"
import type { Phase, Step } from "@/lib/types"
import { WerewolfStrings } from "./strings.th"

// Simple ID generator
const genId = () => crypto.randomUUID()

export function werewolfScriptFactory(settings: WerewolfSettings): Phase[] {
    const phases: Phase[] = []

    // --- Phase 0: Prep ---
    phases.push({
        id: genId(),
        title_th: WerewolfStrings.PREP.TITLE,
        turnLabel: "เตรียมเกม",
        steps: [
            { id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.PREP.DISTRIBUTE_ROLES, can_skip: false },
            { id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.PREP.EXPLAIN_NIGHT, can_skip: true },
            { id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.PREP.EXPLAIN_GM_SIGNALS, can_skip: true },
            { id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.PREP.CHECK_READY, can_skip: false, requires_confirm: true },
        ]
    })

    // --- Game Loop (Rounds 1 to 15) ---
    const MAX_ROUNDS = 15

    for (let round = 1; round <= MAX_ROUNDS; round++) {
        // --- Night Phase ---
        const nightSteps: Step[] = []

        nightSteps.push({ id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.NIGHT.SLEEP, can_skip: false })

        // Wolves
        nightSteps.push({ id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.NIGHT.WOLVES_WAKE, helper_th: `จำนวนหมาป่าเริ่มต้น: ${settings.roles.wolves} ตัว`, can_skip: false })
        nightSteps.push({ id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.NIGHT.WOLVES_SLEEP, can_skip: false })

        // Seer
        if (settings.roles.seer > 0) {
            nightSteps.push({ id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.NIGHT.SEER_WAKE, helper_th: "GM ส่งสัญญาณ: ไพ่ขึ้น=หมาป่า, ไพ่ลง=คนดี", can_skip: false })
            nightSteps.push({ id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.NIGHT.SEER_SLEEP, can_skip: false })
        }

        // Guard
        if (settings.roles.guard > 0) {
            nightSteps.push({ id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.NIGHT.GUARD_WAKE, can_skip: false })
            nightSteps.push({ id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.NIGHT.GUARD_ACTION, helper_th: "ห้ามป้องกันคนเดิม 2 คืนติด", can_skip: false })
            nightSteps.push({ id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.NIGHT.GUARD_SLEEP, can_skip: false })
        }

        // Witch
        if (settings.roles.witch > 0) {
            nightSteps.push({ id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.NIGHT.WITCH_WAKE, can_skip: false })
            nightSteps.push({ id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.NIGHT.WITCH_ACTION_SAVE, helper_th: settings.rules.witchCanSaveSelf ? "สามารถช่วยตัวเองได้" : "ห้ามช่วยตัวเอง", can_skip: false })
            nightSteps.push({ id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.NIGHT.WITCH_ACTION_KILL, can_skip: false })
            nightSteps.push({ id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.NIGHT.WITCH_SLEEP, can_skip: false })
        }

        // End Night Checkpoint
        if (settings.features.checkpointsEnabled) {
            nightSteps.push({ id: genId(), kind: "CHECKPOINT", text_th: WerewolfStrings.NIGHT.CHECKPOINT_RATE, can_skip: true })
        }

        phases.push({
            id: genId(),
            title_th: `คืนที่ ${round}`,
            turnLabel: `คืนที่ ${round}`,
            steps: nightSteps
        })

        // --- Day Phase ---
        const daySteps: Step[] = []

        daySteps.push({ id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.NIGHT.EVERYONE_WAKE, can_skip: false })

        daySteps.push({
            id: genId(),
            kind: "INSTRUCTION",
            text_th: WerewolfStrings.DAY.ANNOUNCE_DEAD,
            helper_th: settings.rules.revealRoleOnDeath ? "เปิดเผยบทบาทผู้ตายทันที" : "ไม่เปิดเผยบทบาท",
            can_skip: false
        })

        daySteps.push({
            id: genId(),
            kind: "INSTRUCTION",
            text_th: WerewolfStrings.DAY.DISCUSS,
            helper_th: settings.rules.discussionTimerEnabled ? `จับเวลา ${settings.rules.discussionMinutes} นาที` : undefined,
            can_skip: false
        })

        daySteps.push({ id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.DAY.VOTE, can_skip: false })
        daySteps.push({ id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.DAY.DEFENSE, can_skip: false })
        daySteps.push({ id: genId(), kind: "INSTRUCTION", text_th: WerewolfStrings.DAY.VOTE_EXECUTE, can_skip: false })

        if (settings.features.checkpointsEnabled) {
            daySteps.push({ id: genId(), kind: "CHECKPOINT", text_th: WerewolfStrings.DAY.CHECKPOINT_RATE, can_skip: true })
        }

        phases.push({
            id: genId(),
            title_th: `กลางวัน ${round}`,
            turnLabel: `กลางวัน ${round}`,
            steps: daySteps
        })
    }

    return phases
}
