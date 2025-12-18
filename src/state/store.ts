import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SessionState, GameId, Note, Checkpoint } from '@/lib/types'

// Use a mapped type for settings to allow extensibility
type SettingsMap = {
    werewolf: any // We can import WerewolfSettings but keeping it loose here avoids circular deps if schema imports types
}

interface AppState {
    // Active session being played
    activeSessionId: string | null

    // All sessions (history) mapped by ID
    sessions: Record<string, SessionState>

    // Last used settings per game (for quick setup)
    lastSettings: Record<GameId, any>

    // Actions
    createSession: (gameId: GameId, settings: any) => void
    resumeSession: (sessionId: string) => void
    endSession: () => void // Just clears activeSessionId, keeps data
    deleteSession: (sessionId: string) => void

    // Session Updates
    updateSession: (sessionId: string, updater: (session: SessionState) => void) => void

    // Specific Actions (can be implemented via updateSession but exposed for convenience)
    addNote: (note: Note) => void
    addCheckpoint: (checkpoint: Checkpoint) => void
    setStep: (phaseIndex: number, stepIndex: number) => void
    markStepComplete: (stepId: string) => void
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            activeSessionId: null,
            sessions: {},
            lastSettings: {
                werewolf: {},
                catan: {}
            },

            createSession: (gameId, settings) => {
                const sessionId = crypto.randomUUID()
                const now = new Date().toISOString()
                const newSession: SessionState = {
                    sessionId,
                    gameId,
                    createdAt: now,
                    updatedAt: now,
                    status: "IN_PROGRESS",
                    settings,
                    phaseIndex: 0,
                    stepIndex: 0,
                    completedStepIds: [],
                    notes: [],
                    checkpoints: [],
                    _version: 1
                }

                set((state) => ({
                    activeSessionId: sessionId,
                    sessions: { ...state.sessions, [sessionId]: newSession },
                    lastSettings: { ...state.lastSettings, [gameId]: settings }
                }))
            },

            resumeSession: (sessionId) => {
                if (get().sessions[sessionId]) {
                    set({ activeSessionId: sessionId })
                }
            },

            endSession: () => {
                const { activeSessionId } = get()
                if (activeSessionId) {
                    get().updateSession(activeSessionId, (s) => {
                        s.status = "COMPLETED"
                    })
                    set({ activeSessionId: null })
                }
            },

            deleteSession: (sessionId) => {
                set((state) => {
                    const newSessions = { ...state.sessions }
                    delete newSessions[sessionId]
                    return {
                        sessions: newSessions,
                        activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId
                    }
                })
            },

            updateSession: (sessionId, updater) => {
                set((state) => {
                    const session = state.sessions[sessionId]
                    if (!session) return state

                    // Create a deep copy or use Immer (Zustand doesn't include Immer by default, using manual copy)
                    // Since SessionState is simple JSON, structuredClone is safe and easy
                    const newSession = structuredClone(session)
                    updater(newSession)
                    newSession.updatedAt = new Date().toISOString()

                    return {
                        sessions: { ...state.sessions, [sessionId]: newSession }
                    }
                })
            },

            // Helpers that operate on activeSession
            addNote: (note) => {
                const { activeSessionId, updateSession } = get()
                if (activeSessionId) {
                    updateSession(activeSessionId, (s) => {
                        s.notes.unshift(note) // Newest first
                    })
                }
            },

            addCheckpoint: (checkpoint) => {
                const { activeSessionId, updateSession } = get()
                if (activeSessionId) {
                    updateSession(activeSessionId, (s) => {
                        s.checkpoints.push(checkpoint)
                    })
                }
            },

            setStep: (phaseIndex, stepIndex) => {
                const { activeSessionId, updateSession } = get()
                if (activeSessionId) {
                    updateSession(activeSessionId, (s) => {
                        s.phaseIndex = phaseIndex
                        s.stepIndex = stepIndex
                    })
                }
            },

            markStepComplete: (stepId) => {
                const { activeSessionId, updateSession } = get()
                if (activeSessionId) {
                    updateSession(activeSessionId, (s) => {
                        if (!s.completedStepIds.includes(stepId)) {
                            s.completedStepIds.push(stepId)
                        }
                    })
                }
            }
        }),
        {
            name: 'boardgamemaster-storage',
            version: 1,
            migrate: (persistedState: any, version) => {
                if (version === 0) {
                    // Placeholder for future migrations
                    // e.g. persistedState.sessions = ...
                }
                return persistedState
            },
        }
    )
)
