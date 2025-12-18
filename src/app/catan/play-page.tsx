import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ArrowLeft, History, Skull, Check, NotebookPen, ChevronLeft, SkipForward, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { RollingLyricView } from "@/components/rolling-lyric-view"
import { NotesSheet } from "@/components/notes-sheet"
import type { RollResult, CatanSettings } from "@/games/catan/types"
import { catanScriptFactory, generateRobberSubflow } from "@/games/catan/scriptFactory"
import { CatanStrings } from "@/games/catan/strings.th"
import type { Step, Checkpoint, Phase } from "@/lib/types"

const DICE_FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"]

export function CatanPlayPage() {
    const navigate = useNavigate()
    const activeSessionId = useAppStore(state => state.activeSessionId)
    const sessions = useAppStore(state => state.sessions)
    const updateSession = useAppStore(state => state.updateSession)
    const addCheckpoint = useAppStore(state => state.addCheckpoint)

    // Game State (Dice)
    const [history, setHistory] = useState<RollResult[]>([])
    const [rolling, setRolling] = useState(false)
    const [currentRoll, setCurrentRoll] = useState<RollResult | null>(null)
    const [notesOpen, setNotesOpen] = useState(false)
    const [robberMode, setRobberMode] = useState(false)
    const [robberSteps, setRobberSteps] = useState<(Step & { phaseIndex: number, stepIndex: number, turnLabel: string })[]>([])
    const [robberStepIndex, setRobberStepIndex] = useState(0)

    const session = activeSessionId ? sessions[activeSessionId] : null
    const settings = session?.settings as CatanSettings | undefined

    // Redirect if no session
    useEffect(() => {
        if (!activeSessionId || !session) {
            navigate("/catan/setup")
        }
    }, [activeSessionId, session, navigate])

    // Generate Script
    const { allSteps } = useMemo(() => {
        if (!session) return { allSteps: [], phases: [] }
        const phasesGen = catanScriptFactory(session.settings)
        let steps: (Step & { phaseIndex: number, stepIndex: number, turnLabel: string })[] = []
        phasesGen.forEach((p: Phase, pIdx: number) => {
            p.steps.forEach((s: Step, sIdx: number) => {
                steps.push({ ...s, phaseIndex: pIdx, stepIndex: sIdx, turnLabel: p.turnLabel })
            })
        })
        return { allSteps: steps, phases: phasesGen }
    }, [session?.settings])

    // Navigation Logic
    const currentGlobalIndex = useMemo(() => {
        if (!session) return 0
        return allSteps.findIndex(s => s.phaseIndex === session.phaseIndex && s.stepIndex === session.stepIndex)
    }, [session?.phaseIndex, session?.stepIndex, allSteps])

    if (!session || !settings) return <div className="p-10 text-center">No Active Session</div>

    const activeStep = robberMode ? robberSteps[robberStepIndex] : allSteps[currentGlobalIndex]
    const isRollStep = activeStep?.text_th.includes("ทอยลูกเต๋า")

    // Determine current player from step context
    const getCurrentPlayerInfo = () => {
        if (!activeStep) return { name: "", index: 0 }
        // Parse from step ID or infer from position in round
        const stepId = activeStep.id
        const match = stepId.match(/turn-(?:start|end)-r(\d+)-p(\d+)/) || stepId.match(/dice-roll-r(\d+)-p(\d+)/)
        if (match) {
            const playerIndex = parseInt(match[2])
            const name = settings.playerNames[playerIndex] || `ผู้เล่น ${String.fromCharCode(65 + playerIndex)}`
            return { name, index: playerIndex }
        }
        // Fallback: check turnLabel for round info
        return { name: settings.playerNames[0] || "ผู้เล่น A", index: 0 }
    }

    const currentPlayer = getCurrentPlayerInfo()

    // Get round number from turnLabel
    const roundMatch = activeStep?.turnLabel.match(/รอบที่\s*(\d+)/)
    const currentRound = roundMatch ? parseInt(roundMatch[1]) : 0

    const handleStepClick = (index: number) => {
        if (robberMode) {
            if (index === robberStepIndex) {
                handleRobberNext()
            }
        } else if (index === currentGlobalIndex) {
            handleMarkDone()
        }
    }

    const handleMarkDone = () => {
        if (!activeStep) return

        // If on dice roll step, must have rolled at least once
        if (isRollStep && !currentRoll) {
            return // Don't advance until rolled
        }

        // Check for robber (rolled 7) - trigger robber mode
        if (isRollStep && currentRoll?.sum === 7 && !robberMode) {
            triggerRobberFlow()
            return
        }

        const nextIndex = currentGlobalIndex + 1
        if (nextIndex < allSteps.length) {
            const nextStep = allSteps[nextIndex]
            updateSession(activeSessionId!, (s) => {
                s.phaseIndex = nextStep.phaseIndex
                s.stepIndex = nextStep.stepIndex
            })
            setCurrentRoll(null) // Reset for next roll step
        } else {
            // End of game
            navigate("/catan/summary")
        }
    }

    const handleBack = () => {
        if (robberMode) {
            if (robberStepIndex > 0) {
                setRobberStepIndex(robberStepIndex - 1)
            }
            return
        }
        const prevIndex = currentGlobalIndex - 1
        if (prevIndex >= 0) {
            const prevStep = allSteps[prevIndex]
            updateSession(activeSessionId!, (s) => {
                s.phaseIndex = prevStep.phaseIndex
                s.stepIndex = prevStep.stepIndex
            })
        }
    }

    const handleCheckpointSave = (cp: Checkpoint) => {
        addCheckpoint(cp)
        handleMarkDone()
    }

    const handleCheckpointSkip = () => {
        handleMarkDone()
    }

    // Dice Logic
    const handleRoll = () => {
        if (rolling) return
        setRolling(true)
        let count = 0
        const isCK = settings?.expansionCitiesAndKnights || false

        const interval = setInterval(() => {
            const d1 = Math.floor(Math.random() * 6) + 1
            const d2 = Math.floor(Math.random() * 6) + 1

            setCurrentRoll({
                die1: d1,
                die2: d2,
                sum: 0,
                timestamp: Date.now(),
                eventDie: isCK ? (Math.random() > 0.5 ? "barbarian" : "gate") : undefined
            })
            count++

            if (count > 10) {
                clearInterval(interval)
                setRolling(false)

                const fd1 = Math.floor(Math.random() * 6) + 1
                const fd2 = Math.floor(Math.random() * 6) + 1

                let fEventDie = undefined
                if (isCK) {
                    const ev = Math.floor(Math.random() * 6) + 1
                    if (ev <= 3) fEventDie = "barbarian"
                    else if (ev === 4) fEventDie = "gate_yellow"
                    else if (ev === 5) fEventDie = "gate_blue"
                    else fEventDie = "gate_green"
                }

                const result: RollResult = {
                    die1: fd1,
                    die2: fd2,
                    sum: fd1 + fd2,
                    timestamp: Date.now(),
                    eventId: (fd1 + fd2) === 7 ? "robber" : undefined,
                    eventDie: fEventDie as any
                }
                setCurrentRoll(result)
                setHistory(prev => [result, ...prev])
            }
        }, 80)
    }

    // Robber Flow
    const triggerRobberFlow = () => {
        const playerName = currentPlayer.name
        const steps = generateRobberSubflow(playerName, settings.friendlyRobberEnabled)
        const mappedSteps = steps.map((s, i) => ({
            ...s,
            phaseIndex: -1, // Special robber phase
            stepIndex: i,
            turnLabel: CatanStrings.ROBBER.TITLE
        }))
        setRobberSteps(mappedSteps)
        setRobberStepIndex(0)
        setRobberMode(true)
    }

    const handleRobberNext = () => {
        if (robberStepIndex < robberSteps.length - 1) {
            setRobberStepIndex(robberStepIndex + 1)
        } else {
            // Exit robber mode, return to normal flow
            setRobberMode(false)
            setRobberSteps([])
            setRobberStepIndex(0)
            setCurrentRoll(null)
            // Advance past the dice roll step
            handleMarkDone()
        }
    }

    // Manual "ทอยได้ 7" trigger
    const handleManualRobber = () => {
        triggerRobberFlow()
    }

    // Jump to next player (end current player's turn early)
    const handleNextPlayer = () => {
        // Find next turn-start step
        for (let i = currentGlobalIndex + 1; i < allSteps.length; i++) {
            if (allSteps[i].id.startsWith("turn-start-")) {
                updateSession(activeSessionId!, (s) => {
                    s.phaseIndex = allSteps[i].phaseIndex
                    s.stepIndex = allSteps[i].stepIndex
                })
                setCurrentRoll(null)
                return
            }
        }
        // If no next turn, go to summary
        navigate("/catan/summary")
    }

    const lastRoll = currentRoll || (history.length > 0 ? history[0] : { die1: 1, die2: 1, sum: 2 })
    const ckMode = settings?.expansionCitiesAndKnights

    const stepsToShow = robberMode ? robberSteps : allSteps
    const activeIndex = robberMode ? robberStepIndex : currentGlobalIndex

    return (
        <div className="h-screen w-full flex flex-col bg-background fixed inset-0">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                    <ArrowLeft />
                </Button>
                <div className="text-center flex-1">
                    <div className="font-bold text-primary">
                        {robberMode ? CatanStrings.ROBBER.TITLE : `ตาของ: ${currentPlayer.name}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {robberMode
                            ? `ขั้นตอน ${robberStepIndex + 1}/${robberSteps.length}`
                            : `${activeStep?.turnLabel} • ${currentRound > 0 ? `รอบ ${currentRound}` : activeStep?.turnLabel}`
                        }
                    </div>
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon"><History /></Button>
                    </SheetTrigger>
                    <SheetContent>
                        <h2 className="text-xl font-bold mb-4">ประวัติการทอย</h2>
                        <div className="space-y-2 h-full overflow-y-auto pb-10">
                            {history.map((roll: RollResult, i: number) => (
                                <div key={roll.timestamp} className="flex justify-between items-center p-2 border-b">
                                    <span className="text-muted-foreground w-8">#{history.length - i}</span>
                                    <span className="font-mono text-xl">{roll.die1} + {roll.die2}</span>
                                    {roll.eventDie && (
                                        <span className="text-xs px-1 bg-muted rounded">{roll.eventDie === "barbarian" ? "🏴‍☠️" : "🏰"}</span>
                                    )}
                                    <span className={cn("font-bold text-xl w-8 text-right", roll.sum === 7 ? "text-red-500" : "")}>{roll.sum}</span>
                                </div>
                            ))}
                            {history.length === 0 && <p className="text-center text-muted-foreground">ยังไม่มีการทอย</p>}
                        </div>
                    </SheetContent>
                </Sheet>
            </header>

            {/* Main Lyrics View */}
            <RollingLyricView
                steps={stepsToShow}
                activeIndex={activeIndex}
                onStepClick={handleStepClick}
                onCheckpointSave={handleCheckpointSave}
                onCheckpointSkip={handleCheckpointSkip}
            />

            {/* Bottom Dock - Always visible like Werewolf */}
            <div className="p-4 pb-8 border-t bg-background/95 backdrop-blur z-10 flex gap-4 items-center justify-between">
                <Button variant="outline" size="icon" onClick={handleBack} className="h-14 w-14 rounded-full">
                    <ChevronLeft />
                </Button>

                <div className="flex-1 flex gap-2 justify-center">
                    {isRollStep && !robberMode ? (
                        <>
                            <Button
                                size="lg"
                                className={cn("h-14 flex-1 text-lg rounded-full shadow-lg", rolling ? "bg-muted" : "bg-orange-600 hover:bg-orange-700 text-white")}
                                onClick={handleRoll}
                                disabled={rolling}
                            >
                                {rolling ? CatanStrings.UI.ROLLING : CatanStrings.UI.ROLL}
                            </Button>
                            {currentRoll && (
                                <Button
                                    size="lg"
                                    className="h-14 flex-1 text-lg rounded-full shadow-lg"
                                    onClick={handleMarkDone}
                                    variant="default"
                                >
                                    <Check className="mr-2 h-6 w-6" />
                                    {CatanStrings.UI.DONE}
                                </Button>
                            )}
                        </>
                    ) : (
                        <Button
                            className="h-14 flex-1 rounded-full text-lg shadow-lg"
                            onClick={robberMode ? handleRobberNext : handleMarkDone}
                            variant="default"
                        >
                            <Check className="mr-2 h-6 w-6" />
                            {CatanStrings.UI.DONE}
                        </Button>
                    )}
                </div>

                {settings.notesEnabled && !robberMode ? (
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-12 w-12 rounded-full"
                        onClick={() => setNotesOpen(true)}
                    >
                        <NotebookPen className="h-5 w-5" />
                    </Button>
                ) : (
                    <div className="w-12" />
                )}
            </div>

            {/* Notes Sheet */}
            {notesOpen && session && activeStep && (
                <NotesSheet
                    onClose={() => setNotesOpen(false)}
                    currentCtx={{
                        phaseId: activeStep.phaseIndex.toString(),
                        stepId: activeStep.id,
                        turnLabel: activeStep.turnLabel || "Unknown"
                    }}
                />
            )}
        </div>
    )
}
