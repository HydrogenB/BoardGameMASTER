import type { TwoRoomsSettings } from "./schema"
import type { Phase, Step } from "@/lib/types"
import { TwoRoomsStrings } from "./strings.th"

// Simple ID generator
const genId = () => crypto.randomUUID()

// Helper to combine helper text based on beginner mode
const getHelper = (base?: string, beginner?: string, isBeginnerMode?: boolean): string | undefined => {
    if (!isBeginnerMode) return base
    if (base && beginner) return `${base}\n\n${beginner}`
    return beginner || base
}

export function twoRoomsScriptFactory(settings: TwoRoomsSettings): Phase[] {
    const phases: Phase[] = []
    const { playerCount, config, features } = settings
    const playersPerRoom = Math.ceil(playerCount / 2)
    const isBeginnerMode = features.beginnerMode !== false // Default true

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
                helper_th: getHelper(
                    undefined,
                    TwoRoomsStrings.SETUP.WELCOME_HELPER,
                    isBeginnerMode
                ),
                can_skip: false,
            },
            {
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.SETUP.DIVIDE_ROOMS(playersPerRoom),
                helper_th: getHelper(
                    TwoRoomsStrings.SETUP.DIVIDE_ROOMS_HELPER,
                    TwoRoomsStrings.SETUP.DIVIDE_ROOMS_BEGINNER,
                    isBeginnerMode
                ),
                can_skip: false,
            },
            {
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.SETUP.DISTRIBUTE_CARDS,
                helper_th: getHelper(
                    TwoRoomsStrings.SETUP.DISTRIBUTE_CARDS_HELPER,
                    TwoRoomsStrings.SETUP.DISTRIBUTE_CARDS_BEGINNER,
                    isBeginnerMode
                ),
                can_skip: false,
            },
            {
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.SETUP.LOOK_AT_CARD,
                helper_th: getHelper(
                    TwoRoomsStrings.SETUP.LOOK_AT_CARD_HELPER,
                    TwoRoomsStrings.SETUP.LOOK_AT_CARD_BEGINNER,
                    isBeginnerMode
                ),
                can_skip: false,
            },
            {
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.SETUP.EXPLAIN_BLUE,
                helper_th: isBeginnerMode ? TwoRoomsStrings.SETUP.EXPLAIN_BLUE_BEGINNER : undefined,
                can_skip: true,
            },
            {
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.SETUP.EXPLAIN_RED,
                helper_th: isBeginnerMode ? TwoRoomsStrings.SETUP.EXPLAIN_RED_BEGINNER : undefined,
                can_skip: true,
            },
            {
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.SETUP.EXPLAIN_SHARE,
                helper_th: isBeginnerMode ? TwoRoomsStrings.SETUP.EXPLAIN_SHARE_BEGINNER : undefined,
                can_skip: true,
            },
            {
                id: "setup-ready",
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.SETUP.START_BUTTON,
                helper_th: isBeginnerMode ? TwoRoomsStrings.SETUP.START_BUTTON_BEGINNER : undefined,
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
            helper_th: getHelper(
                TwoRoomsStrings.ROUND.START_ANNOUNCE_HELPER,
                isFinalRound
                    ? TwoRoomsStrings.FINAL.WARNING_BEGINNER
                    : TwoRoomsStrings.ROUND.START_ANNOUNCE_BEGINNER,
                isBeginnerMode
            ),
            can_skip: false,
            timerSeconds: roundConfig.duration_sec,
        })

        // Elect leader
        roundSteps.push({
            id: genId(),
            kind: "INSTRUCTION",
            text_th: TwoRoomsStrings.ROUND.ELECT_LEADER,
            helper_th: getHelper(
                TwoRoomsStrings.ROUND.ELECT_LEADER_HELPER,
                TwoRoomsStrings.ROUND.ELECT_LEADER_BEGINNER,
                isBeginnerMode
            ),
            can_skip: false,
        })

        // Timer running instruction
        roundSteps.push({
            id: genId(),
            kind: "INSTRUCTION",
            text_th: TwoRoomsStrings.ROUND.TIMER_RUNNING,
            helper_th: getHelper(
                TwoRoomsStrings.ROUND.NO_CROSS_ROOM,
                TwoRoomsStrings.ROUND.TIMER_RUNNING_BEGINNER,
                isBeginnerMode
            ),
            can_skip: false,
        })

        // Can change leader (after round 1)
        if (roundNumber > 1) {
            roundSteps.push({
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.ROUND.CAN_CHANGE_LEADER,
                helper_th: isBeginnerMode ? TwoRoomsStrings.ROUND.CAN_CHANGE_LEADER_BEGINNER : undefined,
                can_skip: true,
            })
        }

        // --- ROUND_END: Hostage swap (if not final) ---
        if (roundConfig.hostages_to_swap > 0) {
            roundSteps.push({
                id: `round-${roundNumber}-timeup`,
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.ROUND_END.TIME_UP,
                helper_th: isBeginnerMode ? TwoRoomsStrings.ROUND_END.TIME_UP_BEGINNER : undefined,
                can_skip: false,
            })

            roundSteps.push({
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.ROUND_END.HOSTAGE_SELECT(roundConfig.hostages_to_swap),
                helper_th: getHelper(
                    TwoRoomsStrings.ROUND_END.HOSTAGE_SELECT_HELPER,
                    TwoRoomsStrings.ROUND_END.HOSTAGE_SELECT_BEGINNER(roundConfig.hostages_to_swap),
                    isBeginnerMode
                ),
                can_skip: false,
            })

            roundSteps.push({
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.ROUND_END.PARLEY,
                helper_th: getHelper(
                    TwoRoomsStrings.ROUND_END.PARLEY_HELPER,
                    TwoRoomsStrings.ROUND_END.PARLEY_BEGINNER,
                    isBeginnerMode
                ),
                can_skip: true,
            })

            roundSteps.push({
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.ROUND_END.SWAP_NOW,
                helper_th: getHelper(
                    TwoRoomsStrings.ROUND_END.SWAP_HELPER,
                    TwoRoomsStrings.ROUND_END.SWAP_BEGINNER,
                    isBeginnerMode
                ),
                can_skip: false,
            })

            if (!isFinalRound) {
                roundSteps.push({
                    id: `round-${roundNumber}-next`,
                    kind: "INSTRUCTION",
                    text_th: TwoRoomsStrings.ROUND_END.NEXT_ROUND,
                    helper_th: isBeginnerMode ? TwoRoomsStrings.ROUND_END.NEXT_ROUND_BEGINNER : undefined,
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
                helper_th: isBeginnerMode ? TwoRoomsStrings.ROUND_END.TIME_UP_BEGINNER : undefined,
                can_skip: false,
            })
            roundSteps.push({
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.FINAL.NO_SWAP,
                helper_th: isBeginnerMode ? TwoRoomsStrings.FINAL.NO_SWAP_BEGINNER : undefined,
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
                helper_th: isBeginnerMode ? TwoRoomsStrings.END.REVEAL_BEGINNER : undefined,
                can_skip: false,
            },
            {
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.END.FIND_KEY,
                helper_th: getHelper(
                    TwoRoomsStrings.END.FIND_KEY_HELPER,
                    TwoRoomsStrings.END.FIND_KEY_BEGINNER,
                    isBeginnerMode
                ),
                can_skip: false,
            },
            {
                id: genId(),
                kind: "INSTRUCTION",
                text_th: TwoRoomsStrings.END.SAME_ROOM,
                helper_th: isBeginnerMode ? TwoRoomsStrings.END.SAME_ROOM_BEGINNER : undefined,
                can_skip: false,
            },
            // Check grey roles if in beginner mode
            ...(isBeginnerMode ? [{
                id: genId(),
                kind: "INSTRUCTION" as const,
                text_th: TwoRoomsStrings.END.GREY_CHECK,
                helper_th: TwoRoomsStrings.END.GREY_CHECK_BEGINNER,
                can_skip: true,
            }] : []),
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
