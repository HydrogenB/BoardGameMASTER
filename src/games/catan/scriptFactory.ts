import type { CatanSettings } from "./types"
import type { Phase, Step } from "@/lib/types"
import { CatanStrings } from "./strings.th"

// Simple ID generator
const genId = () => crypto.randomUUID()

export function catanScriptFactory(settings: CatanSettings): Phase[] {
    const phases: Phase[] = []
    const { playerNames, playerCount, checkpointsEnabled: _checkpointsEnabled } = settings

    // --- Phase 0: เตรียมเกม (Setup Checklist) ---
    phases.push({
        id: genId(),
        title_th: CatanStrings.SETUP.TITLE,
        turnLabel: "เตรียมเกม",
        steps: [
            { id: genId(), kind: "INSTRUCTION", text_th: CatanStrings.SETUP.CHOOSE_MODE, can_skip: false },
            { id: genId(), kind: "INSTRUCTION", text_th: CatanStrings.SETUP.PLACE_TILES, can_skip: false },
            { id: genId(), kind: "INSTRUCTION", text_th: CatanStrings.SETUP.PLACE_NUMBERS, can_skip: false, helper_th: "Beginner: ห้ามวาง 6 ติด 8" },
            { id: genId(), kind: "INSTRUCTION", text_th: CatanStrings.SETUP.PLACE_PORTS, can_skip: false },
            { id: genId(), kind: "INSTRUCTION", text_th: CatanStrings.SETUP.PREPARE_BANK, can_skip: false },
            { id: genId(), kind: "INSTRUCTION", text_th: CatanStrings.SETUP.PREPARE_PIECES, can_skip: false },
            { id: genId(), kind: "INSTRUCTION", text_th: CatanStrings.SETUP.PICK_FIRST, can_skip: false },
            { id: genId(), kind: "INSTRUCTION", text_th: CatanStrings.SETUP.READY, can_skip: false, requires_confirm: true },
        ]
    })

    // --- Phase 1: วางบ้านรอบที่ 1 (Placement Round 1: 0 → n-1) ---
    const placementR1Steps: Step[] = []
    for (let i = 0; i < playerCount; i++) {
        const name = playerNames[i] || `ผู้เล่น ${String.fromCharCode(65 + i)}`
        placementR1Steps.push({
            id: genId(),
            kind: "INSTRUCTION",
            text_th: CatanStrings.PLACEMENT.PLACE_SETTLEMENT_ROAD(name),
            can_skip: false,
        })
    }
    phases.push({
        id: genId(),
        title_th: CatanStrings.PLACEMENT.TITLE_R1,
        turnLabel: "วางบ้านรอบ 1",
        steps: placementR1Steps
    })

    // --- Phase 2: วางบ้านรอบที่ 2 (Placement Round 2: n-1 → 0, reversed snake) ---
    const placementR2Steps: Step[] = []
    for (let i = playerCount - 1; i >= 0; i--) {
        const name = playerNames[i] || `ผู้เล่น ${String.fromCharCode(65 + i)}`
        placementR2Steps.push({
            id: genId(),
            kind: "INSTRUCTION",
            text_th: CatanStrings.PLACEMENT.PLACE_SECOND_AND_COLLECT(name),
            can_skip: false,
            helper_th: "รับทรัพยากรจากทุกช่องที่ติดกับบ้านหลังที่ 2",
        })
    }
    placementR2Steps.push({
        id: genId(),
        kind: "INSTRUCTION",
        text_th: CatanStrings.PLACEMENT.PLACEMENT_COMPLETE,
        can_skip: false,
        requires_confirm: true,
    })
    phases.push({
        id: genId(),
        title_th: CatanStrings.PLACEMENT.TITLE_R2,
        turnLabel: "วางบ้านรอบ 2",
        steps: placementR2Steps
    })

    // --- Phase 3+: วนลูปตาเล่น (Main Turn Loop) ---
    // Generate 20 rounds max, each round has all players take turns
    const MAX_ROUNDS = 20

    for (let round = 1; round <= MAX_ROUNDS; round++) {
        const roundSteps: Step[] = []

        for (let playerIdx = 0; playerIdx < playerCount; playerIdx++) {
            const name = playerNames[playerIdx] || `ผู้เล่น ${String.fromCharCode(65 + playerIdx)}`

            // Turn Start
            roundSteps.push({
                id: `turn-start-r${round}-p${playerIdx}`,
                kind: "INSTRUCTION",
                text_th: CatanStrings.TURN.START(name),
                can_skip: false,
            })

            // Roll Dice (special step - play page will detect this)
            roundSteps.push({
                id: `dice-roll-r${round}-p${playerIdx}`,
                kind: "INSTRUCTION",
                text_th: CatanStrings.TURN.ROLL_DICE,
                can_skip: false,
            })

            // Distribute Resources
            roundSteps.push({
                id: genId(),
                kind: "INSTRUCTION",
                text_th: CatanStrings.TURN.DISTRIBUTE,
                helper_th: CatanStrings.TURN.DISTRIBUTE_HELPER,
                can_skip: false,
            })

            // Trade Phase
            if (settings.enableTradePrompts) {
                roundSteps.push({
                    id: genId(),
                    kind: "INSTRUCTION",
                    text_th: CatanStrings.TURN.TRADE,
                    helper_th: settings.enablePortReminders ? CatanStrings.TURN.TRADE_HELPER_BANK : undefined,
                    can_skip: true,
                })
            }

            // Build Phase
            roundSteps.push({
                id: genId(),
                kind: "INSTRUCTION",
                text_th: CatanStrings.TURN.BUILD,
                helper_th: CatanStrings.TURN.BUILD_COSTS,
                can_skip: true,
            })

            // End Turn
            roundSteps.push({
                id: `turn-end-r${round}-p${playerIdx}`,
                kind: "INSTRUCTION",
                text_th: CatanStrings.TURN.END_TURN(name),
                can_skip: false,
            })
        }

        phases.push({
            id: genId(),
            title_th: CatanStrings.TURN.TITLE(round),
            turnLabel: `รอบที่ ${round}`,
            steps: roundSteps
        })
    }

    return phases
}

// Generate Robber subflow steps (for jump-in when rolling 7)
export function generateRobberSubflow(currentPlayerName: string, friendlyRobberEnabled: boolean): Step[] {
    const steps: Step[] = [
        {
            id: genId(),
            kind: "INSTRUCTION",
            text_th: CatanStrings.ROBBER.DISCARD,
            helper_th: CatanStrings.ROBBER.DISCARD_HELPER,
            can_skip: false,
        },
        {
            id: genId(),
            kind: "INSTRUCTION",
            text_th: CatanStrings.ROBBER.MOVE_ROBBER(currentPlayerName),
            can_skip: false,
        },
        {
            id: genId(),
            kind: "INSTRUCTION",
            text_th: CatanStrings.ROBBER.STEAL(currentPlayerName),
            helper_th: friendlyRobberEnabled ? CatanStrings.ROBBER.FRIENDLY_ROBBER : CatanStrings.ROBBER.STEAL_HELPER,
            can_skip: false,
        },
        {
            id: genId(),
            kind: "INSTRUCTION",
            text_th: CatanStrings.ROBBER.RETURN,
            can_skip: false,
            requires_confirm: true,
        },
    ]
    return steps
}
