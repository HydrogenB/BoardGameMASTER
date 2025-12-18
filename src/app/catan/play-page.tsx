import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ArrowLeft, History, Skull, Check } from "lucide-react"
import { cn } from "@/lib/utils"
// Reusing components
import { RollingLyricView } from "@/components/rolling-lyric-view"
import type { RollResult } from "@/games/catan/types"
import { catanScriptFactory } from "@/games/catan/scriptFactory"
import type { Step } from "@/lib/types"

const DIC_FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"]

export function CatanPlayPage() {
    const navigate = useNavigate()
    const activeSessionId = useAppStore(state => state.activeSessionId)
    const sessions = useAppStore(state => state.sessions)
    const updateSession = useAppStore(state => state.updateSession)

    // Game State (Dice)
    const [history, setHistory] = useState<RollResult[]>([])
    const [rolling, setRolling] = useState(false)
    const [currentRoll, setCurrentRoll] = useState<RollResult | null>(null)

    const session = activeSessionId ? sessions[activeSessionId] : null

    // Generate Script
    const { allSteps } = useMemo(() => {
        if (!session) return { allSteps: [] }
        const phases = catanScriptFactory(session.settings)
        let steps: (Step & { phaseIndex: number, stepIndex: number, turnLabel: string })[] = []
        phases.forEach((p, pIdx) => {
            p.steps.forEach((s, sIdx) => {
                steps.push({ ...s, phaseIndex: pIdx, stepIndex: sIdx, turnLabel: p.turnLabel })
            })
        })
        return { allSteps: steps }
    }, [session?.settings])

    // Navigation Logic
    const currentGlobalIndex = useMemo(() => {
        if (!session) return 0
        return allSteps.findIndex(s => s.phaseIndex === session.phaseIndex && s.stepIndex === session.stepIndex)
    }, [session?.phaseIndex, session?.stepIndex, allSteps])

    if (!session) return <div className="p-10 text-center">No Active Session</div>

    const activeStep = allSteps[currentGlobalIndex]
    const isRollStep = activeStep?.text_th.includes("ทอยลูกเต๋า")

    const handleStepClick = (index: number) => {
        if (index === currentGlobalIndex) {
            handleMarkDone()
        }
    }

    const handleMarkDone = () => {
        const nextIndex = currentGlobalIndex + 1
        if (nextIndex < allSteps.length) {
            const nextStep = allSteps[nextIndex]
            updateSession(activeSessionId!, (s) => {
                s.phaseIndex = nextStep.phaseIndex
                s.stepIndex = nextStep.stepIndex
            })
        }
    }

    // Dice Logic
    const handleRoll = () => {
        if (rolling) return
        setRolling(true)
        let count = 0
        const isCK = session?.settings.expansionCitiesAndKnights || false

        const interval = setInterval(() => {
            // Animation Frames
            const d1 = Math.floor(Math.random() * 6) + 1
            const d2 = Math.floor(Math.random() * 6) + 1
            // C&K Event Die: 1-3 = Ship (diff colors), 4-6 = Gate (diff colors) - simplified 
            // 1=Barbarian, 2,3=Blue/Yellow Ship (just placeholders for visual)

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

                // Final Result
                const fd1 = Math.floor(Math.random() * 6) + 1
                const fd2 = Math.floor(Math.random() * 6) + 1

                // Event Die Logic:
                // 1,2,3 = Barbarian Ship (Black)
                // 4 = Yellow Gate
                // 5 = Blue Gate
                // 6 = Green Gate
                let fEventDie = undefined
                if (isCK) {
                    const ev = Math.floor(Math.random() * 6) + 1
                    if (ev <= 3) fEventDie = "barbarian"
                    else if (ev === 4) fEventDie = "gate_yellow"
                    else if (ev === 5) fEventDie = "gate_blue"
                    else fEventDie = "gate_green"
                }

                const result: RollResult = {
                    die1: fd1, die2: fd2, sum: fd1 + fd2, timestamp: Date.now(),
                    eventId: (fd1 + fd2) === 7 ? "robber" : undefined,
                    eventDie: fEventDie
                }
                setCurrentRoll(result)
                setHistory(prev => [result, ...prev])
            }
        }, 80)
    }

    const lastRoll = currentRoll || (history.length > 0 ? history[0] : { die1: 1, die2: 1, sum: 2 })
    const ckMode = session?.settings.expansionCitiesAndKnights

    return (
        <div className="h-screen flex flex-col items-center bg-stone-100 text-stone-900 fixed inset-0">
            {/* Header */}
            <div className="w-full p-4 flex justify-between items-center bg-white shadow-sm z-20">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                    <ArrowLeft />
                </Button>
                <div className="text-center">
                    <div className="font-bold">{activeStep?.turnLabel}</div>
                    <div className="text-xs text-muted-foreground">{activeStep?.text_th.split(':')[0]}</div>
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon"><History /></Button>
                    </SheetTrigger>
                    <SheetContent>
                        <h2 className="text-xl font-bold mb-4">Roll History</h2>
                        <div className="space-y-2 h-full overflow-y-auto pb-10">
                            {history.map((roll, i) => (
                                <div key={roll.timestamp} className="flex justify-between items-center p-2 border-b">
                                    <span className="text-muted-foreground w-8">#{history.length - i}</span>
                                    <span className="font-mono text-xl">{roll.die1} + {roll.die2}</span>
                                    {roll.eventDie && (
                                        <span className="text-xs px-1 bg-stone-200 rounded">{roll.eventDie === "barbarian" ? "🏴‍☠️" : "🏰"}</span>
                                    )}
                                    <span className={cn("font-bold text-xl w-8 text-right", roll.sum === 7 ? "text-red-500" : "")}>{roll.sum}</span>
                                </div>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Main Lyrics View */}
            <div className="flex-1 w-full bg-stone-50/50">
                <RollingLyricView
                    steps={allSteps}
                    activeIndex={currentGlobalIndex}
                    onStepClick={handleStepClick}
                />
            </div>

            <div className="w-full bg-white border-t p-4 z-20 shadow-lg flex flex-col gap-4">
                {isRollStep ? (
                    <div className="flex flex-col gap-4 animate-in slide-in-from-bottom fade-in duration-500">
                        {/* Dice Row */}
                        <div className="flex gap-4 items-center justify-center">
                            {/* Red Die */}
                            <div className={cn("w-16 h-16 flex items-center justify-center bg-red-500 text-white rounded-xl text-4xl shadow-md", rolling && "animate-spin")}>
                                {DIC_FACES[lastRoll.die1]}
                            </div>
                            {/* White Die */}
                            <div className={cn("w-16 h-16 flex items-center justify-center bg-white border-2 border-stone-300 text-black rounded-xl text-4xl shadow-md", rolling && "animate-spin")}>
                                {DIC_FACES[lastRoll.die2]}
                            </div>

                            {/* Event Die (C&K) */}
                            {ckMode && (
                                <div className={cn("w-16 h-16 flex items-center justify-center bg-yellow-100 border-2 border-yellow-400 text-black rounded-xl text-2xl shadow-md", rolling && "animate-spin")}>
                                    {lastRoll.eventDie === "barbarian" ? "🏴‍☠️" :
                                        lastRoll.eventDie?.startsWith("gate") ? "🏰" : "?"}
                                </div>
                            )}

                            {/* Sum Result */}
                            <div className="flex flex-col ml-4">
                                <span className="text-xs text-muted-foreground uppercase font-bold">Sum</span>
                                <span className={cn("text-5xl font-black", lastRoll.sum === 7 ? "text-red-500" : "")}>{lastRoll.sum}</span>
                            </div>
                        </div>

                        {/* Robber Alert */}
                        {lastRoll.sum === 7 && !rolling && (
                            <div className="bg-red-100 text-red-700 p-2 rounded-lg text-center text-sm font-bold flex items-center justify-center gap-2">
                                <Skull className="w-4 h-4" />
                                Robber Active! Discard if > 7 cards.
                            </div>
                        )}

                        <Button
                            size="lg"
                            className={cn("h-16 text-xl rounded-full w-full", rolling ? "bg-stone-300" : "bg-orange-600 hover:bg-orange-700 text-white")}
                            onClick={handleRoll}
                            disabled={rolling}
                        >
                            {rolling ? "Rolling..." : "ROLL DICE"}
                        </Button>
                    </div>
                ) : (
                    <Button
                        size="lg"
                        variant="default" // custom or default
                        className="w-full h-14 text-lg rounded-full"
                        onClick={handleMarkDone}
                    >
                        <Check className="mr-2" /> {activeStep?.id.includes('end') ? "จบเทิร์น" : "ถัดไป"}
                    </Button>
                )}
            </div>
        </div>
    )
}
