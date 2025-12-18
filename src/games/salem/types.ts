import type { z } from "zod"
import type { salemSettingsSchema, SalemGameState, PlayerStatus } from "./schema"

export type SalemSettings = z.infer<typeof salemSettingsSchema>

// Tryal card calculation - official rules
export function getWitchCount(playerCount: number): number {
    if (playerCount <= 7) return 1
    return 2
}

export function getTryalCardCounts(playerCount: number) {
    const totalCards = playerCount * 5
    const witchCards = getWitchCount(playerCount)
    const notWitchCards = totalCards - witchCards
    return { witch: witchCards, notWitch: notWitchCards, total: totalCards, perPlayer: 5 }
}

export function getDefaultSalemSettings(): SalemSettings {
    return {
        playerCount: 6,
        playerNames: ["ผู้เล่น 1", "ผู้เล่น 2", "ผู้เล่น 3", "ผู้เล่น 4", "ผู้เล่น 5", "ผู้เล่น 6"],
        hasConstable: true,
        beginnerMode: true,
        notesEnabled: true
    }
}

export function initializeGameState(settings: SalemSettings): SalemGameState {
    const players: PlayerStatus[] = settings.playerNames.slice(0, settings.playerCount).map((name) => ({
        name,
        isAlive: true,
        accusations: 0,
        tryalCardsRevealed: 0,
        hasBlackCat: false,
        isWitch: null,
        hasGavelToken: false,
        hasConfessed: false
    }))

    return {
        currentPhase: "setup",
        roundNumber: 0,
        currentPlayerIndex: 0,
        players,
        witchTarget: null,
        constableProtected: null,
        blackCatHolder: -1,
        witchesRevealed: 0,
        totalWitches: getWitchCount(settings.playerCount),
        confessedPlayers: []
    }
}

export const SALEM_PLAYER_COUNTS = [4, 5, 6, 7, 8, 9, 10, 11, 12] as const

// Only Constable is a special role in base game
export type RoleId = "r_witch" | "r_constable"

export interface RoleConfig {
    id: RoleId
    name: string
    icon: string
    settingsKey: keyof SalemSettings | null
}

export const SALEM_ROLES: RoleConfig[] = [
    { id: "r_witch", name: "แม่มด", icon: "🧙‍♀️", settingsKey: null },
    { id: "r_constable", name: "ผู้คุม", icon: "👮", settingsKey: "hasConstable" }
]

export function isRoleActive(roleId: RoleId, settings: SalemSettings): boolean {
    const role = SALEM_ROLES.find(r => r.id === roleId)
    if (!role) return false
    if (role.settingsKey === null) return true
    return settings[role.settingsKey] as boolean
}

export function checkWinCondition(state: SalemGameState): "town" | "witch" | null {
    if (state.witchesRevealed >= state.totalWitches) return "town"
    const alivePlayers = state.players.filter(p => p.isAlive)
    const aliveNonWitches = alivePlayers.filter(p => p.isWitch !== true)
    if (aliveNonWitches.length === 0 && alivePlayers.length > 0) return "witch"
    return null
}

export function addAccusation(state: SalemGameState, playerIndex: number): { newState: SalemGameState; shouldReveal: boolean } {
    const newState = { ...state, players: [...state.players] }
    const player = { ...newState.players[playerIndex] }
    player.accusations += 1
    newState.players[playerIndex] = player
    return { newState, shouldReveal: player.accusations >= 7 }
}

export function revealTryalCard(state: SalemGameState, playerIndex: number, isWitch: boolean): SalemGameState {
    const newState = { ...state, players: [...state.players] }
    const player = { ...newState.players[playerIndex] }
    player.tryalCardsRevealed += 1
    player.accusations = 0
    if (isWitch) {
        player.isWitch = true
        player.isAlive = false
        newState.witchesRevealed += 1
    } else if (player.tryalCardsRevealed >= 5) {
        player.isAlive = false
    }
    newState.players[playerIndex] = player
    return newState
}

export function setBlackCatHolder(state: SalemGameState, playerIndex: number): SalemGameState {
    return {
        ...state,
        blackCatHolder: playerIndex,
        players: state.players.map((p, i) => ({ ...p, hasBlackCat: i === playerIndex }))
    }
}

export function setGavelToken(state: SalemGameState, playerIndex: number): SalemGameState {
    return {
        ...state,
        constableProtected: state.players[playerIndex]?.name || null,
        players: state.players.map((p, i) => ({ ...p, hasGavelToken: i === playerIndex }))
    }
}

// Player confesses - reveals 1 Tryal card for immunity (Rulebook: Confession Phase)
export function playerConfess(state: SalemGameState, playerIndex: number): SalemGameState {
    const newState = { ...state, players: [...state.players] }
    const player = { ...newState.players[playerIndex] }
    player.hasConfessed = true
    player.tryalCardsRevealed += 1
    if (player.tryalCardsRevealed >= 5) player.isAlive = false
    newState.players[playerIndex] = player
    newState.confessedPlayers = [...(newState.confessedPlayers || []), player.name]
    return newState
}

// Resolve night: check protected, confessed, then apply kill
export function resolveNight(state: SalemGameState): {
    newState: SalemGameState
    wasProtected: boolean
    wasConfessed: boolean
    victim: string | null
    victimDied: boolean
} {
    const newState = { ...state, players: [...state.players] }
    const victim = state.witchTarget
    const wasProtected = victim === state.constableProtected
    const wasConfessed = state.confessedPlayers?.includes(victim || "") || false
    let victimDied = false

    // Apply kill if not protected and not confessed
    if (victim && !wasProtected && !wasConfessed) {
        const victimIndex = newState.players.findIndex(p => p.name === victim)
        if (victimIndex >= 0) {
            const player = { ...newState.players[victimIndex] }
            player.tryalCardsRevealed += 1
            if (player.tryalCardsRevealed >= 5) {
                player.isAlive = false
                victimDied = true
            }
            newState.players[victimIndex] = player
        }
    }

    // Clear night state
    newState.witchTarget = null
    newState.constableProtected = null
    newState.confessedPlayers = []
    newState.players = newState.players.map(p => ({ ...p, hasGavelToken: false, hasConfessed: false }))
    newState.roundNumber += 1

    return { newState, wasProtected, wasConfessed, victim, victimDied }
}

// Black Cat holder must reveal 1 Tryal during Conspiracy
export function conspiracyReveal(state: SalemGameState): { newState: SalemGameState; revealedPlayer: string | null } {
    if (state.blackCatHolder < 0) return { newState: state, revealedPlayer: null }
    const player = state.players[state.blackCatHolder]
    if (!player || !player.isAlive) return { newState: state, revealedPlayer: null }

    const newState = { ...state, players: [...state.players] }
    const updatedPlayer = { ...newState.players[state.blackCatHolder] }
    updatedPlayer.tryalCardsRevealed += 1
    if (updatedPlayer.tryalCardsRevealed >= 5) updatedPlayer.isAlive = false
    newState.players[state.blackCatHolder] = updatedPlayer

    return { newState, revealedPlayer: player.name }
}
