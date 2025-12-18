import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { twoRoomsScriptFactory, getTimerColor } from "@/games/two-rooms/scriptFactory"
import type { TwoRoomsSettings } from "@/games/two-rooms/schema"
import type { Step, Checkpoint } from "@/lib/types"
import { RollingLyricView, type ExtendedStep } from "@/components/rolling-lyric-view"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    ChevronLeft,
    Check,
    Pause,
    Play,
    Volume2,
    VolumeX,
    Bell,
    Bomb,
    RotateCcw,
    NotebookPen
} from "lucide-react"
import { NotesSheet } from "@/components/notes-sheet"

// ===== SOUNDBOARD COMPONENT =====
function Soundboard({
    onWhistle,
    onBomb,
    soundEnabled
}: {
    onWhistle: () => void
    onBomb: () => void
    soundEnabled: boolean
}) {
    return (
        <div className="flex gap-2 justify-center px-4">
            <Button
                variant="outline"
                size="lg"
                onClick={onWhistle}
                disabled={!soundEnabled}
                className="flex-1 h-12"
            >
                <Bell className="w-4 h-4 mr-2" />
                📢 นกหวีด
            </Button>
            <Button
                variant="outline"
                size="lg"
                onClick={onBomb}
                disabled={!soundEnabled}
                className="flex-1 h-12"
            >
                <Bomb className="w-4 h-4 mr-2" />
                💣 ระเบิด!
            </Button>
        </div>
    )
}

// ===== FLOATING TIMER COMPONENT =====
function FloatingTimer({
    seconds,
    totalSeconds,
    isPaused,
    onTogglePause,
    onReset
}: {
    seconds: number
    totalSeconds: number
    isPaused: boolean
    onTogglePause: () => void
    onReset: () => void
}) {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    const color = getTimerColor(seconds, totalSeconds)
    const progress = (seconds / totalSeconds) * 100

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40">
            <div className={cn(
                "bg-background/95 backdrop-blur-lg rounded-full px-6 py-3 shadow-xl border-2 flex items-center gap-4",
                seconds <= 60 && seconds > 0 && "animate-pulse border-red-500"
            )}>
                {/* Circular mini progress */}
                <div className="relative w-10 h-10">
                    <svg className="w-10 h-10 transform -rotate-90">
                        <circle
                            cx="20" cy="20" r="16"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            className="text-muted/30"
                        />
                        <circle
                            cx="20" cy="20" r="16"
                            stroke={color}
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 16}
                            strokeDashoffset={2 * Math.PI * 16 * (1 - progress / 100)}
                            className="transition-all duration-1000"
                        />
                    </svg>
                </div>

                {/* Timer display */}
                <div
                    className="text-3xl font-mono font-bold min-w-[90px] text-center"
                    style={{ color }}
                >
                    {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                </div>

                {/* Controls */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onTogglePause}
                    className="h-10 w-10"
                >
                    {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onReset}
                    className="h-10 w-10"
                >
                    <RotateCcw className="w-4 h-4" />
                </Button>
            </div>
            {isPaused && seconds > 0 && (
                <div className="text-center text-yellow-500 text-sm mt-1 animate-pulse">
                    ⏸️ หยุดชั่วคราว
                </div>
            )}
        </div>
    )
}

// ===== ROUND PROGRESS INDICATOR =====
function RoundProgress({
    currentRound,
    totalRounds,
    hostagesToSwap
}: {
    currentRound: number
    totalRounds: number
    hostagesToSwap: number
}) {
    return (
        <div className="flex items-center gap-2 justify-center">
            {[...Array(totalRounds)].map((_, idx) => {
                const roundNum = idx + 1
                const isActive = roundNum === currentRound
                const isCompleted = roundNum < currentRound
                const isFinal = roundNum === totalRounds

                return (
                    <div key={idx} className="flex items-center">
                        <div
                            className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                                isActive && "bg-primary text-primary-foreground scale-110 ring-2 ring-primary/50",
                                isCompleted && "bg-primary/20 text-primary",
                                !isActive && !isCompleted && "bg-muted text-muted-foreground",
                                isFinal && isActive && "bg-red-500 text-white ring-red-500/50"
                            )}
                        >
                            {isFinal ? "🚨" : roundNum}
                        </div>
                        {idx < totalRounds - 1 && (
                            <div className={cn(
                                "w-6 h-0.5 mx-1",
                                isCompleted ? "bg-primary" : "bg-muted"
                            )} />
                        )}
                    </div>
                )
            })}
            {hostagesToSwap > 0 && (
                <span className="text-xs text-muted-foreground ml-2">
                    🔄 {hostagesToSwap} คน
                </span>
            )}
        </div>
    )
}

// ===== MAIN PLAY PAGE =====
export function TwoRoomsPlayPage() {
    const navigate = useNavigate()
    const activeSessionId = useAppStore(state => state.activeSessionId)
    const sessions = useAppStore(state => state.sessions)
    const updateSession = useAppStore(state => state.updateSession)
    const markStepComplete = useAppStore(state => state.markStepComplete)
    const addCheckpoint = useAppStore(state => state.addCheckpoint)

    const session = activeSessionId ? sessions[activeSessionId] : null

    // Timer state
    const [timeRemaining, setTimeRemaining] = useState(0)
    const [totalTime, setTotalTime] = useState(0)
    const [isPaused, setIsPaused] = useState(true)
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [hasPlayedWarning, setHasPlayedWarning] = useState(false)
    const [notesOpen, setNotesOpen] = useState(false)

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Redirect if no session
    useEffect(() => {
        if (!activeSessionId || !session) {
            navigate("/two-rooms/setup")
        }
    }, [activeSessionId, session, navigate])

    // Flatten phases to steps
    const { allSteps, phases } = useMemo(() => {
        if (!session) return { allSteps: [], phases: [] }

        const settings = session.settings as TwoRoomsSettings
        const generatedPhases = twoRoomsScriptFactory(settings)
        const steps: ExtendedStep[] = []

        generatedPhases.forEach((p, pIdx) => {
            p.steps.forEach((s, sIdx) => {
                steps.push({
                    ...s,
                    phaseIndex: pIdx,
                    stepIndex: sIdx,
                    turnLabel: p.turnLabel
                })
            })
        })

        return { allSteps: steps, phases: generatedPhases }
    }, [session?.settings])

    // Current global index
    const currentGlobalIndex = useMemo(() => {
        if (!session) return 0
        return allSteps.findIndex(s => s.phaseIndex === session.phaseIndex && s.stepIndex === session.stepIndex)
    }, [session?.phaseIndex, session?.stepIndex, allSteps])

    if (!session) return null

    const settings = session.settings as TwoRoomsSettings
    const activeStep = allSteps[currentGlobalIndex]
    const hasTimer = activeStep?.timerSeconds !== undefined && activeStep.timerSeconds > 0

    // Initialize timer when entering a timed step
    useEffect(() => {
        if (hasTimer && activeStep?.timerSeconds) {
            setTimeRemaining(activeStep.timerSeconds)
            setTotalTime(activeStep.timerSeconds)
            setIsPaused(false) // Auto-start timer
            setHasPlayedWarning(false)
        }
    }, [currentGlobalIndex, hasTimer, activeStep?.timerSeconds])

    // Timer countdown logic
    useEffect(() => {
        if (!hasTimer || isPaused || timeRemaining <= 0) {
            if (timerRef.current) clearInterval(timerRef.current)
            return
        }

        timerRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current)
                    playSound("buzzer")
                    // Auto-advance after timer ends
                    setTimeout(() => handleMarkDone(), 1000)
                    return 0
                }

                // Warning at 60 seconds
                if (prev === 61 && settings.features.autoWarningAt60s && !hasPlayedWarning) {
                    playSound("warning")
                    setHasPlayedWarning(true)
                }

                return prev - 1
            })
        }, 1000)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [hasTimer, isPaused, timeRemaining, settings.features.autoWarningAt60s, hasPlayedWarning])

    // Sound effects
    const playSound = useCallback((type: "whistle" | "buzzer" | "warning" | "bomb") => {
        if (!soundEnabled) return

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        switch (type) {
            case "whistle":
                oscillator.frequency.value = 1200
                oscillator.type = "sine"
                gainNode.gain.value = 0.3
                oscillator.start()
                oscillator.stop(audioContext.currentTime + 0.5)
                break
            case "buzzer":
                oscillator.frequency.value = 200
                oscillator.type = "square"
                gainNode.gain.value = 0.4
                oscillator.start()
                oscillator.stop(audioContext.currentTime + 1)
                break
            case "warning":
                oscillator.frequency.value = 800
                oscillator.type = "sine"
                gainNode.gain.value = 0.3
                oscillator.start()
                setTimeout(() => oscillator.stop(), 200)
                setTimeout(() => {
                    const osc2 = audioContext.createOscillator()
                    osc2.connect(gainNode)
                    osc2.frequency.value = 800
                    osc2.start()
                    osc2.stop(audioContext.currentTime + 0.2)
                }, 300)
                break
            case "bomb":
                oscillator.frequency.value = 100
                oscillator.type = "sawtooth"
                gainNode.gain.value = 0.5
                oscillator.start()
                oscillator.stop(audioContext.currentTime + 0.8)
                break
        }
    }, [soundEnabled])

    const handleMarkDone = () => {
        if (!activeStep) return

        markStepComplete(activeStep.id)

        const nextIndex = currentGlobalIndex + 1
        if (nextIndex < allSteps.length) {
            const nextStep = allSteps[nextIndex]
            updateSession(activeSessionId!, (s) => {
                s.phaseIndex = nextStep.phaseIndex
                s.stepIndex = nextStep.stepIndex
            })
        } else {
            navigate("/two-rooms/summary")
        }
    }

    const handleBack = () => {
        const prevIndex = currentGlobalIndex - 1
        if (prevIndex >= 0) {
            const prevStep = allSteps[prevIndex]
            updateSession(activeSessionId!, (s) => {
                s.phaseIndex = prevStep.phaseIndex
                s.stepIndex = prevStep.stepIndex
            })
        }
    }

    const handleStepClick = (index: number) => {
        if (index === currentGlobalIndex) {
            handleMarkDone()
        }
    }

    const handleCheckpointSave = (cp: Checkpoint) => {
        addCheckpoint(cp)
        handleMarkDone()
    }

    const handleTogglePause = () => {
        setIsPaused(prev => !prev)
    }

    const handleResetTimer = () => {
        if (activeStep?.timerSeconds) {
            setTimeRemaining(activeStep.timerSeconds)
            setTotalTime(activeStep.timerSeconds)
            setIsPaused(true)
            setHasPlayedWarning(false)
        }
    }

    // Get round info for header
    const getCurrentRoundInfo = () => {
        const currentPhase = phases[session.phaseIndex]
        const roundMatch = currentPhase?.turnLabel.match(/รอบที่ (\d+)/)
        if (roundMatch) {
            const roundNum = parseInt(roundMatch[1])
            const roundConfig = settings.config.rounds[roundNum - 1]
            return {
                round: roundNum,
                total: settings.config.rounds.length,
                hostages: roundConfig?.hostages_to_swap || 0
            }
        }
        return null
    }

    const roundInfo = getCurrentRoundInfo()

    return (
        <div className="h-screen w-full flex flex-col bg-background fixed inset-0">
            {/* HEADER */}
            <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                    <ChevronLeft />
                </Button>
                <div className="text-center">
                    <h2 className="font-bold text-sm">
                        {phases[session.phaseIndex]?.title_th || "Two Rooms"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        {roundInfo
                            ? `Round ${roundInfo.round}/${roundInfo.total} • ${roundInfo.hostages > 0 ? `Swap ${roundInfo.hostages}` : "Final!"}`
                            : activeStep?.turnLabel || ""}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                >
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </Button>
            </header>

            {/* ROUND PROGRESS BAR */}
            {roundInfo && (
                <div className="bg-muted/30 py-2 border-b">
                    <RoundProgress
                        currentRound={roundInfo.round}
                        totalRounds={roundInfo.total}
                        hostagesToSwap={roundInfo.hostages}
                    />
                </div>
            )}

            {/* FLOATING TIMER */}
            {hasTimer && timeRemaining > 0 && (
                <FloatingTimer
                    seconds={timeRemaining}
                    totalSeconds={totalTime}
                    isPaused={isPaused}
                    onTogglePause={handleTogglePause}
                    onReset={handleResetTimer}
                />
            )}

            {/* ROLLING LYRIC VIEW - Smooth scrolling script display */}
            <RollingLyricView
                steps={allSteps}
                activeIndex={currentGlobalIndex}
                onStepClick={handleStepClick}
                onCheckpointSave={handleCheckpointSave}
                onCheckpointSkip={handleMarkDone}
            />

            {/* SOUNDBOARD (show during rounds) */}
            {roundInfo && (
                <div className="py-2 border-t bg-background/80 backdrop-blur">
                    <Soundboard
                        onWhistle={() => playSound("whistle")}
                        onBomb={() => playSound("bomb")}
                        soundEnabled={soundEnabled}
                    />
                </div>
            )}

            {/* BOTTOM DOCK - Same pattern as werewolf */}
            <div className="p-4 pb-8 border-t bg-background/95 backdrop-blur z-10 flex gap-4 items-center justify-between">
                <Button variant="outline" size="icon" onClick={handleBack} className="h-14 w-14 rounded-full">
                    <ChevronLeft />
                </Button>

                <div className="flex-1 flex gap-2 justify-center">
                    <Button
                        className="h-14 flex-1 rounded-full text-lg shadow-lg"
                        onClick={handleMarkDone}
                        variant="default"
                        disabled={hasTimer && timeRemaining > 0 && !isPaused}
                    >
                        <Check className="mr-2 h-6 w-6" />
                        ทำเสร็จแล้ว
                    </Button>
                </div>

                <Button
                    variant="secondary"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={() => setNotesOpen(true)}
                >
                    <NotebookPen className="h-5 w-5" />
                </Button>
            </div>

            {/* Notes Sheet */}
            {notesOpen && activeStep && (
                <NotesSheet
                    onClose={() => setNotesOpen(false)}
                    currentCtx={{
                        phaseId: session.phaseIndex.toString(),
                        stepId: activeStep.id,
                        turnLabel: activeStep.turnLabel || "Two Rooms"
                    }}
                />
            )}
        </div>
    )
}
