import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { twoRoomsScriptFactory, getTimerColor } from "@/games/two-rooms/scriptFactory"
import type { TwoRoomsSettings } from "@/games/two-rooms/schema"
import type { GameState } from "@/games/two-rooms/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
    ChevronLeft,
    ChevronRight,
    Pause,
    Play,
    Volume2,
    VolumeX,
    Bell,
    Bomb,
    SkipForward
} from "lucide-react"

// ===== SOUNDBOARD COMPONENT =====
function Soundboard({
    onWhistle,
    onBomb,
    disabled,
    soundEnabled
}: {
    onWhistle: () => void
    onBomb: () => void
    disabled: boolean
    soundEnabled: boolean
}) {
    return (
        <div className="flex gap-2 justify-center">
            <Button
                variant="outline"
                size="lg"
                onClick={onWhistle}
                disabled={disabled || !soundEnabled}
                className="flex-1 h-14"
            >
                <Bell className="w-5 h-5 mr-2" />
                📢 นกหวีด
            </Button>
            <Button
                variant="outline"
                size="lg"
                onClick={onBomb}
                disabled={disabled || !soundEnabled}
                className="flex-1 h-14"
            >
                <Bomb className="w-5 h-5 mr-2" />
                💣 ระเบิด!
            </Button>
        </div>
    )
}

// ===== BIG TIMER COMPONENT =====
function BigTimer({
    seconds,
    totalSeconds,
    isPaused,
    onTogglePause
}: {
    seconds: number
    totalSeconds: number
    isPaused: boolean
    onTogglePause: () => void
}) {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    const color = getTimerColor(seconds, totalSeconds)

    return (
        <div className="text-center py-8">
            <div
                className="text-8xl font-mono font-bold tracking-tight transition-colors duration-500"
                style={{ color }}
            >
                {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
            {isPaused && (
                <div className="text-xl text-yellow-500 mt-2 animate-pulse">
                    ⏸️ หยุดชั่วคราว
                </div>
            )}
            <Button
                variant="ghost"
                size="lg"
                onClick={onTogglePause}
                className="mt-4"
            >
                {isPaused ? (
                    <>
                        <Play className="w-5 h-5 mr-2" />
                        เล่นต่อ
                    </>
                ) : (
                    <>
                        <Pause className="w-5 h-5 mr-2" />
                        หยุด
                    </>
                )}
            </Button>
        </div>
    )
}

// ===== ROLLING SCRIPT COMPONENT =====
function RollingScript({
    text,
    helper,
    isHighlight
}: {
    text: string
    helper?: string
    isHighlight?: boolean
}) {
    return (
        <Card className={cn(
            "transition-all duration-300",
            isHighlight && "border-yellow-500 bg-yellow-500/10 animate-pulse"
        )}>
            <CardContent className="p-6 text-center">
                <p className={cn(
                    "text-xl font-medium",
                    isHighlight && "text-2xl"
                )}>
                    {text}
                </p>
                {helper && (
                    <p className="text-sm text-muted-foreground mt-2">
                        {helper}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}

// ===== MAIN PLAY PAGE =====
export function TwoRoomsPlayPage() {
    const navigate = useNavigate()
    const session = useAppStore(state =>
        state.activeSessionId ? state.sessions[state.activeSessionId] : null
    )
    const setStep = useAppStore(state => state.setStep)

    // Game state
    const [gameState, setGameState] = useState<GameState>("SETUP_PHASE")
    const [timeRemaining, setTimeRemaining] = useState(0)
    const [totalTime, setTotalTime] = useState(0)
    const [isPaused, setIsPaused] = useState(true)
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [hasPlayedWarning, setHasPlayedWarning] = useState(false)

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Redirect if no session
    useEffect(() => {
        if (!session) {
            navigate("/two-rooms/setup")
        }
    }, [session, navigate])

    if (!session) return null

    const settings = session.settings as TwoRoomsSettings
    const phases = twoRoomsScriptFactory(settings)
    const currentPhase = phases[session.phaseIndex]
    const currentStep = currentPhase?.steps[session.stepIndex]

    // Determine if current step has a timer
    const hasTimer = currentStep?.timerSeconds !== undefined && currentStep.timerSeconds > 0

    // Initialize timer when entering a timed step
    useEffect(() => {
        if (hasTimer && currentStep?.timerSeconds) {
            setTimeRemaining(currentStep.timerSeconds)
            setTotalTime(currentStep.timerSeconds)
            setIsPaused(false) // Auto-start timer
            setHasPlayedWarning(false)
            setGameState("ROUND_ACTIVE")
        } else {
            setGameState(session.phaseIndex === 0 ? "SETUP_PHASE" :
                session.phaseIndex === phases.length - 1 ? "GAME_OVER" : "ROUND_END")
        }
    }, [session.phaseIndex, session.stepIndex])

    // Timer countdown logic
    useEffect(() => {
        if (!hasTimer || isPaused) {
            if (timerRef.current) clearInterval(timerRef.current)
            return
        }

        timerRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    // Time's up!
                    if (timerRef.current) clearInterval(timerRef.current)
                    playSound("buzzer")
                    setGameState("ROUND_END")
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
    }, [hasTimer, isPaused, settings.features.autoWarningAt60s, hasPlayedWarning])

    // Sound effects (simplified - would use Web Audio API in production)
    const playSound = useCallback((type: "whistle" | "buzzer" | "warning" | "bomb") => {
        if (!soundEnabled) return

        // Use browser's built-in beep for MVP
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

    // Navigation helpers using setStep
    const advanceStep = () => {
        if (!currentPhase) return

        const nextStepIndex = session.stepIndex + 1
        if (nextStepIndex < currentPhase.steps.length) {
            setStep(session.phaseIndex, nextStepIndex)
        } else {
            // Move to next phase
            const nextPhaseIndex = session.phaseIndex + 1
            if (nextPhaseIndex < phases.length) {
                setStep(nextPhaseIndex, 0)
            } else {
                // Game complete
                navigate("/two-rooms/summary")
            }
        }
    }

    const goBackStep = () => {
        if (session.stepIndex > 0) {
            setStep(session.phaseIndex, session.stepIndex - 1)
        } else if (session.phaseIndex > 0) {
            const prevPhase = phases[session.phaseIndex - 1]
            setStep(session.phaseIndex - 1, prevPhase.steps.length - 1)
        }
    }

    const handleNext = () => {
        advanceStep()
    }

    const handleBack = () => {
        goBackStep()
    }

    const handleTogglePause = () => {
        setIsPaused(prev => !prev)
    }

    const handleSkipTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        setTimeRemaining(0)
        setGameState("ROUND_END")
        advanceStep()
    }

    // Get round info for header
    const getCurrentRoundInfo = () => {
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
        <div className="min-h-screen bg-background flex flex-col">
            {/* HEADER: Round info */}
            <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b p-4">
                <div className="container max-w-lg mx-auto flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>

                    <div className="text-center">
                        <div className="text-lg font-bold">
                            {currentPhase?.title_th}
                        </div>
                        {roundInfo && (
                            <div className="text-sm text-muted-foreground">
                                Round {roundInfo.round}/{roundInfo.total}
                                {roundInfo.hostages > 0
                                    ? ` • Swap ${roundInfo.hostages}`
                                    : " • Final!"
                                }
                            </div>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                    >
                        {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </Button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 container max-w-lg mx-auto p-4 space-y-6">

                {/* BIG TIMER (when in ROUND_ACTIVE) */}
                {hasTimer && timeRemaining > 0 && (
                    <BigTimer
                        seconds={timeRemaining}
                        totalSeconds={totalTime}
                        isPaused={isPaused}
                        onTogglePause={handleTogglePause}
                    />
                )}

                {/* ROLLING SCRIPT */}
                {currentStep && (
                    <RollingScript
                        text={currentStep.text_th}
                        helper={currentStep.helper_th}
                        isHighlight={gameState === "ROUND_END" || currentStep.requires_confirm}
                    />
                )}

                {/* SOUNDBOARD (always visible during active rounds) */}
                {(gameState === "ROUND_ACTIVE" || gameState === "ROUND_END") && (
                    <Soundboard
                        onWhistle={() => playSound("whistle")}
                        onBomb={() => playSound("bomb")}
                        disabled={false}
                        soundEnabled={soundEnabled}
                    />
                )}

                {/* SKIP TIMER BUTTON (only during active timer) */}
                {hasTimer && timeRemaining > 0 && (
                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={handleSkipTimer}
                    >
                        <SkipForward className="w-4 h-4 mr-2" />
                        ข้ามไป (หมดเวลาก่อน)
                    </Button>
                )}
            </main>

            {/* FOOTER: Navigation */}
            <footer className="sticky bottom-0 bg-background/95 backdrop-blur border-t p-4">
                <div className="container max-w-lg mx-auto flex gap-4">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={session.phaseIndex === 0 && session.stepIndex === 0}
                        className="flex-1"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        ย้อนกลับ
                    </Button>
                    <Button
                        onClick={handleNext}
                        className="flex-1"
                        disabled={hasTimer && timeRemaining > 0 && !isPaused}
                    >
                        {currentStep?.requires_confirm ? "✅ ยืนยัน" : "ถัดไป"}
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </footer>
        </div>
    )
}
