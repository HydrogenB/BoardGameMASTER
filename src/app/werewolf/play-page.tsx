import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { RollingLyricView } from "@/components/rolling-lyric-view"
import { Button } from "@/components/ui/button"
import { NotesSheet } from "@/components/notes-sheet"
import type { Step, Checkpoint } from "@/lib/types"
import { werewolfScriptFactory } from "@/games/werewolf/scriptFactory"
import { ChevronLeft, Check, NotebookPen, RotateCcw } from "lucide-react"

export function WerewolfPlayPage() {
    const navigate = useNavigate()
    const activeSessionId = useAppStore(state => state.activeSessionId)
    const sessions = useAppStore(state => state.sessions)
    const updateSession = useAppStore(state => state.updateSession)
    const markStepComplete = useAppStore(state => state.markStepComplete)

    const session = activeSessionId ? sessions[activeSessionId] : null

    // Guard: No Session
    useEffect(() => {
        if (!activeSessionId || !session) {
            navigate("/")
        }
    }, [activeSessionId, session, navigate])

    // Flatten phases to a single steps list for the view
    // Memoize this to avoid recalc
    const { allSteps } = useMemo(() => {
        if (!session) return { allSteps: [] }

        // In a real app we might store the generated script in the session to avoid regeneration drift
        // For MVP, we regenerate based on settings. 

        const phases = werewolfScriptFactory(session.settings)
        let steps: (Step & { phaseIndex: number, stepIndex: number, turnLabel: string })[] = []

        phases.forEach((p, pIdx) => {
            p.steps.forEach((s, sIdx) => {
                steps.push({ ...s, phaseIndex: pIdx, stepIndex: sIdx, turnLabel: p.turnLabel })
            })
        })

        return { allSteps: steps }
    }, [session?.settings])

    // Current global index
    const currentGlobalIndex = useMemo(() => {
        if (!session) return 0
        return allSteps.findIndex(s => s.phaseIndex === session.phaseIndex && s.stepIndex === session.stepIndex)
    }, [session?.phaseIndex, session?.stepIndex, allSteps])

    const [notesOpen, setNotesOpen] = useState(false)

    if (!session) return null

    const activeStep = allSteps[currentGlobalIndex]
    const addCheckpoint = useAppStore(state => state.addCheckpoint)

    const handleCheckpointSave = (cp: Checkpoint) => {
        addCheckpoint(cp)
        handleMarkDone() // Auto advance after save
    }

    const handleCheckpointSkip = () => {
        handleMarkDone() // Skip advances too
    }

    const handleStepClick = (index: number) => {
        if (index === currentGlobalIndex) {
            handleMarkDone()
        }
    }

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
            // End of Script - Navigate to Summary or show Toast
            navigate("/werewolf/summary")
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

    return (
        <div className="h-screen w-full flex flex-col bg-background fixed inset-0">
            {/* HEADER */}
            <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                    <ChevronLeft />
                </Button>
                <div className="text-center">
                    <h2 className="font-bold text-sm">คืนที่ {session.phaseIndex} • ขั้นตอน {session.stepIndex + 1}</h2>
                    <p className="text-xs text-muted-foreground">{activeStep?.turnLabel || "Werewolf"}</p>
                </div>
                <Button variant="ghost" size="icon">
                    <RotateCcw className="w-4 h-4" />
                </Button>
            </header>

            {/* LYRIC */}
            <RollingLyricView
                steps={allSteps}
                activeIndex={currentGlobalIndex}
                onStepClick={handleStepClick}
                onCheckpointSave={handleCheckpointSave}
                onCheckpointSkip={handleCheckpointSkip}
            />

            {/* BOTTOM DOCK */}
            <div className="p-4 pb-8 border-t bg-background/95 backdrop-blur z-10 flex gap-4 items-center justify-between">
                <Button variant="outline" size="icon" onClick={handleBack} className="h-14 w-14 rounded-full">
                    <ChevronLeft />
                </Button>

                <div className="flex-1 flex gap-2 justify-center">
                    <Button
                        className="h-14 flex-1 rounded-full text-lg shadow-lg"
                        onClick={handleMarkDone}
                        variant="default"
                    >
                        <Check className="mr-2 h-6 w-6" />
                        ทำเสร็จแล้ว
                    </Button>
                </div>

                <div className="flex flex-col gap-1">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-12 w-12 rounded-full"
                        onClick={() => setNotesOpen(true)}
                    >
                        <NotebookPen className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {notesOpen && session && activeStep && (
                <NotesSheet
                    onClose={() => setNotesOpen(false)}
                    currentCtx={{
                        phaseId: session.phaseIndex.toString(), // MVP: using index as ID equivalent
                        stepId: activeStep.id,
                        turnLabel: activeStep.turnLabel || "Unknown"
                    }}
                />
            )}
        </div>
    )
}
