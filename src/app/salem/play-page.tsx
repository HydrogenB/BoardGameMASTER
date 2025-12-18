import { useState, useMemo, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ChevronLeft, Check, NotebookPen, History, Users, Skull, Moon, Sun, RefreshCcw, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { RollingLyricView } from "@/components/rolling-lyric-view"
import { NotesSheet } from "@/components/notes-sheet"
import type { SalemSettings, SalemGameState, PlayerStatus } from "@/games/salem/types"
import {
    initializeGameState,
    setBlackCatHolder,
    addAccusation,
    revealTryalCard,
    setGavelToken,
    resolveNight,
    checkWinCondition
} from "@/games/salem/types"
import { salemScriptFactory } from "@/games/salem/scriptFactory"
import type { Checkpoint, Phase } from "@/lib/types"

// Game Phase type for the loop
type GamePhase = "setup" | "first_night" | "day" | "night" | "dawn_result" | "end"

// Haptic feedback
const triggerHaptic = () => {
    if ('vibrate' in navigator) navigator.vibrate(50)
}

// Player Status Card
function PlayerCard({
    player,
    index,
    onAccuse,
    onSelect,
    isSelectMode,
    selectLabel,
    compact
}: {
    player: PlayerStatus
    index: number
    onAccuse?: () => void
    onSelect?: () => void
    isSelectMode?: boolean
    selectLabel?: string
    compact?: boolean
}) {
    if (!player.isAlive) {
        return (
            <div className="p-2 rounded-lg bg-muted/30 opacity-50 text-center">
                <div className="flex items-center justify-center gap-1 text-xs">
                    <Skull className="h-3 w-3" />
                    <span className="line-through">{player.name}</span>
                </div>
                {player.isWitch && <span className="text-xs text-red-500">🧙‍♀️</span>}
            </div>
        )
    }

    return (
        <div
            className={cn(
                "p-2 rounded-lg text-center transition-all",
                player.hasBlackCat ? "bg-gray-800 border border-gray-600" : "bg-muted",
                isSelectMode && "cursor-pointer hover:ring-2 hover:ring-primary active:scale-95"
            )}
            onClick={isSelectMode ? onSelect : undefined}
        >
            <div className="text-sm font-medium truncate">
                {player.hasBlackCat && "🐈‍⬛ "}
                {player.hasGavelToken && "🛡️ "}
                {player.name}
            </div>

            {/* Accusations bar */}
            {!compact && (
                <div className="flex justify-center gap-0.5 mt-1">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-2 h-2 rounded-full",
                                i < player.accusations ? "bg-red-500" : "bg-gray-600"
                            )}
                        />
                    ))}
                </div>
            )}

            {!compact && (
                <div className="text-xs text-muted-foreground mt-1">
                    {player.tryalCardsRevealed}/5 เปิด
                </div>
            )}

            {onAccuse && !isSelectMode && !compact && (
                <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-6 text-xs w-full"
                    onClick={(e) => { e.stopPropagation(); onAccuse() }}
                >
                    +1 กล่าวหา
                </Button>
            )}

            {isSelectMode && (
                <div className="text-xs text-primary mt-1 font-medium">{selectLabel || "เลือก"}</div>
            )}
        </div>
    )
}

// Player Grid Panel
function PlayerPanel({
    gameState,
    onAccuse,
    onSelectPlayer,
    selectMode,
    selectLabel,
    compact
}: {
    gameState: SalemGameState
    onAccuse?: (index: number) => void
    onSelectPlayer?: (index: number) => void
    selectMode?: boolean
    selectLabel?: string
    compact?: boolean
}) {
    const alivePlayers = gameState.players.filter(p => p.isAlive).length

    return (
        <div className="p-3 border-b bg-background/95">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>{alivePlayers} / {gameState.players.length} ยังอยู่</span>
                    <span className="text-muted-foreground">| รอบที่ {gameState.roundNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-red-500">🧙‍♀️ {gameState.witchesRevealed}/{gameState.totalWitches}</span>
                </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {gameState.players.map((player, i) => (
                    <PlayerCard
                        key={i}
                        player={player}
                        index={i}
                        onAccuse={onAccuse ? () => onAccuse(i) : undefined}
                        onSelect={onSelectPlayer ? () => onSelectPlayer(i) : undefined}
                        isSelectMode={selectMode && player.isAlive}
                        selectLabel={selectLabel}
                        compact={compact}
                    />
                ))}
            </div>
        </div>
    )
}

// Dawn Result Dialog
function DawnResultDialog({
    open,
    result,
    onContinue
}: {
    open: boolean
    result: { wasProtected: boolean; victim: string | null } | null
    onContinue: () => void
}) {
    if (!result) return null

    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl">
                        🌅 ผลคืนนี้
                    </DialogTitle>
                </DialogHeader>
                <div className="text-center py-6 space-y-4">
                    {result.victim ? (
                        result.wasProtected ? (
                            <>
                                <div className="text-6xl">🛡️</div>
                                <p className="text-lg">
                                    <span className="font-bold">{result.victim}</span> ถูกโจมตี
                                </p>
                                <p className="text-green-500 font-bold text-xl">
                                    แต่ได้รับการปกป้องจาก Constable!
                                </p>
                                <p className="text-muted-foreground">ไม่มีใครเสียชีวิตคืนนี้</p>
                            </>
                        ) : (
                            <>
                                <div className="text-6xl">💀</div>
                                <p className="text-lg">
                                    <span className="font-bold text-red-500">{result.victim}</span>
                                </p>
                                <p className="text-red-500 font-bold text-xl">
                                    ถูกแม่มดสังหาร!
                                </p>
                                <p className="text-muted-foreground">เปิด Tryal Card 1 ใบ</p>
                            </>
                        )
                    ) : (
                        <>
                            <div className="text-6xl">😴</div>
                            <p className="text-lg">แม่มดไม่ได้เลือกเหยื่อ</p>
                            <p className="text-muted-foreground">คืนนี้ผ่านไปอย่างสงบ</p>
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={onContinue} className="w-full">
                        <Sun className="mr-2 h-4 w-4" />
                        เข้าสู่กลางวัน
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Win Dialog
function WinDialog({
    winner,
    onFinish
}: {
    winner: "town" | "witch" | null
    onFinish: () => void
}) {
    if (!winner) return null

    return (
        <Dialog open={!!winner}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl">
                        🏆 จบเกม!
                    </DialogTitle>
                </DialogHeader>
                <div className="text-center py-6 space-y-4">
                    {winner === "town" ? (
                        <>
                            <div className="text-6xl">🎉</div>
                            <p className="text-2xl font-bold text-green-500">ชาวเมืองชนะ!</p>
                            <p className="text-muted-foreground">แม่มดทั้งหมดถูกจับได้แล้ว</p>
                        </>
                    ) : (
                        <>
                            <div className="text-6xl">🧙‍♀️</div>
                            <p className="text-2xl font-bold text-red-500">แม่มดชนะ!</p>
                            <p className="text-muted-foreground">เหลือแต่แม่มดในเกม</p>
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={onFinish} className="w-full">
                        ดูสรุปเกม
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function SalemPlayPage() {
    const navigate = useNavigate()
    const activeSessionId = useAppStore(state => state.activeSessionId)
    const sessions = useAppStore(state => state.sessions)
    const updateSession = useAppStore(state => state.updateSession)
    const addCheckpointFn = useAppStore(state => state.addCheckpoint)

    const session = activeSessionId ? sessions[activeSessionId] : null
    const settings = session?.settings as SalemSettings | undefined

    // UI State
    const [notesOpen, setNotesOpen] = useState(false)
    const [showPlayerPanel, setShowPlayerPanel] = useState(false)
    const [selectMode, setSelectMode] = useState<"blackcat" | "target" | "protect" | "confessor" | null>(null)

    // Game Engine State
    const [gameState, setGameState] = useState<SalemGameState | null>(null)
    const [currentGamePhase, setCurrentGamePhase] = useState<GamePhase>("setup")
    const [dawnResult, setDawnResult] = useState<{ wasProtected: boolean; victim: string | null } | null>(null)
    const [winner, setWinner] = useState<"town" | "witch" | null>(null)
    const [confessorReveal, setConfessorReveal] = useState<{ playerName: string; isWitch: boolean | null } | null>(null)

    // Initialize game state
    useEffect(() => {
        if (settings && !gameState) {
            setGameState(initializeGameState(settings))
        }
    }, [settings, gameState])

    // Generate script phases based on current game phase
    const { phases, allSteps } = useMemo(() => {
        if (!settings) return { phases: [], allSteps: [] }

        // Get full script
        const allPhases = salemScriptFactory(settings)

        // Filter phases based on current game phase
        let filteredPhases: Phase[] = []

        switch (currentGamePhase) {
            case "setup":
                filteredPhases = allPhases.filter(p => p.turnLabel === "Setup")
                break
            case "first_night":
                filteredPhases = allPhases.filter(p => p.turnLabel === "คืนแรก")
                break
            case "day":
                filteredPhases = allPhases.filter(p => p.turnLabel === "กลางวัน" || p.turnLabel === "Conspiracy")
                break
            case "night":
                filteredPhases = allPhases.filter(p => p.turnLabel === "กลางคืน")
                break
            default:
                filteredPhases = allPhases
        }

        const steps = filteredPhases.flatMap((phase, phaseIndex) =>
            phase.steps.map((step, stepIndex) => ({
                ...step,
                phaseIndex,
                stepIndex,
                turnLabel: phase.turnLabel
            }))
        )

        return { phases: filteredPhases, allSteps: steps }
    }, [settings, currentGamePhase])

    // Current position
    const currentGlobalIndex = useMemo(() => {
        if (!session) return 0
        let idx = 0
        for (let p = 0; p < session.phaseIndex; p++) {
            idx += phases[p]?.steps.length || 0
        }
        return idx + session.stepIndex
    }, [session, phases])

    const currentPhase = phases[session?.phaseIndex || 0]
    const activeStep = allSteps[currentGlobalIndex]

    // Phase transition logic
    const transitionToPhase = useCallback((newPhase: GamePhase) => {
        setCurrentGamePhase(newPhase)
        if (activeSessionId) {
            updateSession(activeSessionId, s => {
                s.phaseIndex = 0
                s.stepIndex = 0
            })
        }
    }, [activeSessionId, updateSession])

    // Handle reaching end of current phase
    const handlePhaseEnd = useCallback(() => {
        if (!gameState) return

        switch (currentGamePhase) {
            case "setup":
                transitionToPhase("first_night")
                break
            case "first_night":
                // After first night, go to day
                setGameState(prev => prev ? { ...prev, roundNumber: 1 } : prev)
                transitionToPhase("day")
                break
            case "day":
                // Day -> Night (when Night card drawn)
                transitionToPhase("night")
                break
            case "night":
                // Night ends -> Resolve and show result
                const result = resolveNight(gameState)
                setGameState(result.newState)
                setDawnResult({ wasProtected: result.wasProtected, victim: result.victim })

                // Check win condition
                const win = checkWinCondition(result.newState)
                if (win) {
                    setWinner(win)
                }
                break
        }
    }, [currentGamePhase, gameState, transitionToPhase])

    // Navigation
    const handleStepClick = useCallback((globalIndex: number) => {
        if (!activeSessionId || !phases.length) return
        triggerHaptic()

        let remaining = globalIndex
        for (let p = 0; p < phases.length; p++) {
            if (remaining < phases[p].steps.length) {
                updateSession(activeSessionId, s => {
                    s.phaseIndex = p
                    s.stepIndex = remaining
                })
                return
            }
            remaining -= phases[p].steps.length
        }
    }, [activeSessionId, phases, updateSession])

    const handleNext = useCallback(() => {
        if (!activeSessionId || !phases.length) return
        triggerHaptic()

        const nextGlobal = currentGlobalIndex + 1
        if (nextGlobal >= allSteps.length) {
            // End of current phase script
            handlePhaseEnd()
            return
        }
        handleStepClick(nextGlobal)
    }, [activeSessionId, currentGlobalIndex, allSteps.length, handleStepClick, handlePhaseEnd])

    const handleBack = useCallback(() => {
        if (currentGlobalIndex > 0) {
            triggerHaptic()
            handleStepClick(currentGlobalIndex - 1)
        }
    }, [currentGlobalIndex, handleStepClick])

    // Continue after dawn result
    const handleDawnContinue = () => {
        setDawnResult(null)
        transitionToPhase("day")
    }

    // Game actions
    const handleAccuse = (playerIndex: number) => {
        if (!gameState) return
        const { newState, shouldReveal } = addAccusation(gameState, playerIndex)
        setGameState(newState)

        if (shouldReveal) {
            alert(`⚠️ ${newState.players[playerIndex].name} ถูกกล่าวหาครบ 7 ครั้ง!\nต้องเปิด Tryal Card 1 ใบ`)
        }
    }

    const handleRevealTryal = (playerIndex: number, isWitch: boolean) => {
        if (!gameState) return
        const newState = revealTryalCard(gameState, playerIndex, isWitch)
        setGameState(newState)

        const win = checkWinCondition(newState)
        if (win) {
            setWinner(win)
        }
    }

    const handleSelectPlayer = (playerIndex: number) => {
        if (!gameState || !selectMode) return

        if (selectMode === "blackcat") {
            setGameState(setBlackCatHolder(gameState, playerIndex))
        } else if (selectMode === "protect") {
            setGameState(setGavelToken(gameState, playerIndex))
        } else if (selectMode === "target") {
            setGameState(prev => prev ? { ...prev, witchTarget: prev.players[playerIndex].name } : prev)
        } else if (selectMode === "confessor") {
            // Confessor reveals one Tryal card (for GM knowledge)
            setConfessorReveal({
                playerName: gameState.players[playerIndex].name,
                isWitch: null // GM will see and record manually
            })
        }

        setSelectMode(null)
        setShowPlayerPanel(false)
    }

    const handleCheckpointSave = (checkpoint: Checkpoint) => {
        addCheckpointFn(checkpoint)
        handleNext()
    }

    if (!session || !settings || !gameState) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <p className="text-muted-foreground">ไม่พบเซสชัน กรุณาเริ่มเกมใหม่</p>
            </div>
        )
    }

    return (
        <div className="h-screen w-full flex flex-col bg-background fixed inset-0">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur z-10">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <History className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="overflow-y-auto">
                        <div className="space-y-4 mt-8">
                            <h3 className="font-bold">Script Steps</h3>
                            <div className="space-y-2">
                                {phases.map((phase, pIdx) => (
                                    <div key={phase.id}>
                                        <p className="text-sm font-semibold text-primary">{phase.title_th}</p>
                                        {phase.steps.map((step, sIdx) => {
                                            const globalIdx = phases.slice(0, pIdx).reduce((a, p) => a + p.steps.length, 0) + sIdx
                                            return (
                                                <button
                                                    key={step.id}
                                                    onClick={() => handleStepClick(globalIdx)}
                                                    className={cn(
                                                        "block w-full text-left text-xs py-1 px-2 rounded truncate",
                                                        globalIdx === currentGlobalIndex
                                                            ? "bg-primary/20 text-primary"
                                                            : "text-muted-foreground hover:bg-muted"
                                                    )}
                                                >
                                                    {step.text_th.slice(0, 35)}...
                                                </button>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>

                            {/* Phase Jump Buttons */}
                            <div className="border-t pt-4 space-y-2">
                                <h4 className="text-sm font-semibold">ข้ามไป Phase:</h4>
                                <div className="flex flex-wrap gap-2">
                                    <Button size="sm" variant="outline" onClick={() => transitionToPhase("day")}>
                                        <Sun className="h-3 w-3 mr-1" /> Day
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => transitionToPhase("night")}>
                                        <Moon className="h-3 w-3 mr-1" /> Night
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>

                <div className="text-center flex-1">
                    <h2 className="font-bold text-sm">{currentPhase?.title_th || "Salem 1692"}</h2>
                    <p className="text-xs text-muted-foreground">
                        รอบ {gameState.roundNumber} • {currentGlobalIndex + 1} / {allSteps.length}
                    </p>
                </div>

                <Button
                    variant={showPlayerPanel ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setShowPlayerPanel(!showPlayerPanel)}
                >
                    <Users className="h-5 w-5" />
                </Button>
            </header>

            {/* Player Panel */}
            {showPlayerPanel && (
                <PlayerPanel
                    gameState={gameState}
                    onAccuse={currentGamePhase === "day" ? handleAccuse : undefined}
                    onSelectPlayer={selectMode ? handleSelectPlayer : undefined}
                    selectMode={!!selectMode}
                    selectLabel={
                        selectMode === "blackcat" ? "มอบ Black Cat" :
                            selectMode === "target" ? "💀 เลือกเหยื่อ" :
                                selectMode === "protect" ? "🛡️ ปกป้อง" :
                                    selectMode === "confessor" ? "👁️ ตรวจสอบ" : undefined
                    }
                />
            )}

            {/* Action Buttons (Night Phase) */}
            {(currentGamePhase === "night" || currentGamePhase === "first_night") && (
                <div className="p-2 border-b bg-muted/50 flex gap-2 justify-center flex-wrap">
                    <Button
                        size="sm"
                        variant={gameState.blackCatHolder >= 0 ? "secondary" : "default"}
                        onClick={() => { setShowPlayerPanel(true); setSelectMode("blackcat") }}
                    >
                        🐈‍⬛ Black Cat
                        {gameState.blackCatHolder >= 0 && " ✓"}
                    </Button>
                    <Button
                        size="sm"
                        variant={gameState.witchTarget ? "secondary" : "destructive"}
                        onClick={() => { setShowPlayerPanel(true); setSelectMode("target") }}
                    >
                        💀 เหยื่อ
                        {gameState.witchTarget && `: ${gameState.witchTarget}`}
                    </Button>
                    {settings.hasConstable && (
                        <Button
                            size="sm"
                            variant={gameState.constableProtected ? "secondary" : "outline"}
                            onClick={() => { setShowPlayerPanel(true); setSelectMode("protect") }}
                        >
                            🛡️ ปกป้อง
                            {gameState.constableProtected && ` ✓`}
                        </Button>
                    )}
                    {settings.hasConfessor && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setShowPlayerPanel(true); setSelectMode("confessor") }}
                        >
                            <Eye className="h-3 w-3 mr-1" />
                            ⛪ บาทหลวง
                        </Button>
                    )}
                </div>
            )}

            {/* Day Phase Quick Actions */}
            {currentGamePhase === "day" && (
                <div className="p-2 border-b bg-muted/50 flex gap-2 justify-center">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => transitionToPhase("night")}
                    >
                        <Moon className="h-3 w-3 mr-1" />
                        🌙 จั่ว Night Card
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPlayerPanel(!showPlayerPanel)}
                    >
                        <Users className="h-3 w-3 mr-1" />
                        กล่าวหาผู้เล่น
                    </Button>
                </div>
            )}

            {/* Main Content - RollingLyricView */}
            <RollingLyricView
                steps={allSteps}
                activeIndex={currentGlobalIndex}
                onStepClick={handleStepClick}
                onCheckpointSave={handleCheckpointSave}
                onCheckpointSkip={handleNext}
            />

            {/* Footer */}
            <div className="p-4 pb-8 border-t bg-background/95 backdrop-blur z-10 flex gap-4 items-center justify-between">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleBack}
                    className="h-14 w-14 rounded-full"
                    disabled={currentGlobalIndex === 0}
                >
                    <ChevronLeft />
                </Button>
                <div className="flex-1 flex gap-2 justify-center">
                    <Button
                        className="h-14 flex-1 rounded-full text-lg shadow-lg"
                        onClick={handleNext}
                    >
                        <Check className="mr-2 h-6 w-6" />
                        ทำเสร็จแล้ว
                    </Button>
                </div>
                {settings.notesEnabled ? (
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
            {notesOpen && activeStep && (
                <NotesSheet
                    onClose={() => setNotesOpen(false)}
                    currentCtx={{
                        phaseId: (session.phaseIndex).toString(),
                        stepId: activeStep.id,
                        turnLabel: activeStep.turnLabel || ""
                    }}
                />
            )}

            {/* Dawn Result Dialog */}
            <DawnResultDialog
                open={!!dawnResult}
                result={dawnResult}
                onContinue={handleDawnContinue}
            />

            {/* Win Dialog */}
            <WinDialog
                winner={winner}
                onFinish={() => navigate("/salem/summary")}
            />

            {/* Confessor Reveal Dialog */}
            <Dialog open={!!confessorReveal} onOpenChange={() => setConfessorReveal(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>⛪ บาทหลวงตรวจสอบ</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-center">
                        <p className="mb-4">
                            ดู Tryal Card 1 ใบ ของ <span className="font-bold">{confessorReveal?.playerName}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            (แสดงการ์ดให้บาทหลวงดูเงียบๆ แล้วเก็บกลับ)
                        </p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setConfessorReveal(null)} className="w-full">
                            เสร็จสิ้น
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
