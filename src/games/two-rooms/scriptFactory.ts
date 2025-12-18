import type { TwoRoomsSettings } from "./schema"
import type { Phase, Step } from "@/lib/types"
import { TwoRoomsStrings } from "./strings.th"

// Simple ID generator
const genId = () => crypto.randomUUID()

export function twoRoomsScriptFactory(settings: TwoRoomsSettings): Phase[] {
    const phases: Phase[] = []
    const { playerCount, config, features: _features } = settings
    const playersPerRoom = Math.ceil(playerCount / 2)
    const _totalRounds = config.rounds.length

    // ===== Phase 0: SETUP_PHASE =====
    phases.push({
        id: genId(),
        title_th: TwoRoomsStrings.SETUP.TITLE,
        turnLabel: "เตรียมเกม",
        steps: [
            {
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.SETUP.WELCOME,
                can_skip: false,
            },
            {
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.SETUP.DIVIDE_ROOMS(playersPerRoom),
                helper_th: TwoRoomsStrings.SETUP.DIVIDE_ROOMS_HELPER,
                can_skip: false,
            },
            {
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.SETUP.DISTRIBUTE_CARDS,
                helper_th: TwoRoomsStrings.SETUP.DISTRIBUTE_CARDS_HELPER,
                can_skip: false,
            },
            {
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.SETUP.LOOK_AT_CARD,
                helper_th: TwoRoomsStrings.SETUP.LOOK_AT_CARD_HELPER,
                can_skip: false,
            },
            {
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.SETUP.EXPLAIN_BLUE,
                can_skip: true,
            },
            {
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.SETUP.EXPLAIN_RED,
                can_skip: true,
            },
            {
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.SETUP.EXPLAIN_SHARE,
                can_skip: true,
            },
            {
                id: "setup-ready",
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.SETUP.START_BUTTON,
                can_skip: false,
                requires_confirm: true,
            },
        ],
    })

    // ===== Phase 1-N: ROUND_ACTIVE + ROUND_END per round =====
    config.rounds.forEach((roundConfig, index) => {
        const roundNumber = roundConfig.round_idx
        const isFinalRound = index === config.rounds.length - 1
        const durationMinutes = Math.floor(roundConfig.duration_sec / 60)

        const roundSteps: Step[] = []

        // --- ROUND_ACTIVE: Timer step ---
        roundSteps.push({
            id: `round-${roundNumber}-timer`,
            kind: "INSTRUCTION",
            text_th: isFinalRound
                ? TwoRoomsStrings.FINAL.WARNING
                : TwoRoomsStrings.ROUND.START_ANNOUNCE(roundNumber, durationMinutes),
            can_skip: false,
            timerSeconds: roundConfig.duration_sec,
        })

        // Elect leader
        roundSteps.push({
            id: genId(),
            kind: "INSTRUCTION",
            text_th: TwoRoomsStrings.ROUND.ELECT_LEADER,
            helper_th: TwoRoomsStrings.ROUND.ELECT_LEADER_HELPER,
            can_skip: false,
        })

        // Timer running instruction
        roundSteps.push({
            id: genId(),
            kind: "INSTRUCTION",
            text_th: TwoRoomsStrings.ROUND.TIMER_RUNNING,
            helper_th: TwoRoomsStrings.ROUND.NO_CROSS_ROOM,
            can_skip: false,
        })

        // Can change leader (after round 1)
        if (roundNumber > 1) {
            roundSteps.push({
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.ROUND.CAN_CHANGE_LEADER,
                can_skip: true,
            })
        }

        // --- ROUND_END: Hostage swap (if not final) ---
        if (roundConfig.hostages_to_swap > 0) {
            roundSteps.push({
                id: `round-${roundNumber}-timeup`,
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.ROUND_END.TIME_UP,
                can_skip: false,
            })

            roundSteps.push({
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.ROUND_END.HOSTAGE_SELECT(roundConfig.hostages_to_swap),
                helper_th: TwoRoomsStrings.ROUND_END.HOSTAGE_SELECT_HELPER,
                can_skip: false,
            })

            roundSteps.push({
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.ROUND_END.PARLEY,
                helper_th: TwoRoomsStrings.ROUND_END.PARLEY_HELPER,
                can_skip: true,
            })

            roundSteps.push({
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.ROUND_END.SWAP_NOW,
                helper_th: TwoRoomsStrings.ROUND_END.SWAP_HELPER,
                can_skip: false,
            })

            if (!isFinalRound) {
                roundSteps.push({
                    id: `round-${roundNumber}-next`,
                    kind: "INSTRUCTION",
                    text_th: TwoRoomsStrings.ROUND_END.NEXT_ROUND,
                    can_skip: false,
                    requires_confirm: true,
                })
            }
        } else {
            // Final round with no swap
            roundSteps.push({
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.ROUND_END.TIME_UP,
                can_skip: false,
            })
            roundSteps.push({
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.FINAL.NO_SWAP,
                can_skip: false,
            })
        }

        phases.push({
            id: genId(),
            title_th: isFinalRound
                ? TwoRoomsStrings.FINAL.TITLE
                : TwoRoomsStrings.ROUND.TITLE(roundNumber),
            turnLabel: `รอบที่ ${roundNumber}`,
            steps: roundSteps,
        })
    })

    // ===== Final Phase: GAME_OVER =====
    phases.push({
        id: genId(),
        title_th: TwoRoomsStrings.END.TITLE,
        turnLabel: "จบเกม",
        steps: [
            {
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.END.REVEAL,
                can_skip: false,
            },
            {
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.END.FIND_KEY,
                helper_th: TwoRoomsStrings.END.FIND_KEY_HELPER,
                can_skip: false,
            },
            {
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.END.SAME_ROOM,
                can_skip: false,
            },
            {
                id: "game-result",
                kind: "INSTRUCTION",
                text_th: "ประกาศผู้ชนะ!",
                helper_th: "🔴 Bomber อยู่ห้องเดียว = ทีมแดงชนะ | 🔵 คนละห้อง = ทีมน้ำเงินชนะ",
                can_skip: false,
                requires_confirm: true,
            },
        ],
    })

    return phases
}

// ===== Helper: Get round label for display =====
export function getRoundLabel(roundIndex: number, totalRounds: number): string {
    return TwoRoomsStrings.UI.ROUND_LABEL(roundIndex + 1, totalRounds)
}

// ===== Helper: Get timer color based on remaining time =====
export function getTimerColor(remainingSeconds: number, totalSeconds: number): string {
    const ratio = remainingSeconds / totalSeconds
    if (ratio > 0.5) return "#22c55e"  // green
    if (ratio > 0.2) return "#eab308"  // yellow
    return "#ef4444"                    // red
}
