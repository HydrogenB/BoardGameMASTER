import { useState, useMemo, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ChevronLeft, Check, NotebookPen, History, Users, Skull, Moon, Sun, Hand } from "lucide-react"
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
    checkWinCondition,
    playerConfess,
    conspiracyReveal
} from "@/games/salem/types"
import { salemScriptFactory } from "@/games/salem/scriptFactory"
import { SalemStrings } from "@/games/salem/strings.th"
import type { Checkpoint, Phase } from "@/lib/types"

type GamePhase = "setup" | "first_night" | "day" | "night" | "conspiracy" | "death" | "end"

const triggerHaptic = () => { if ('vibrate' in navigator) navigator.vibrate(50) }

// Player Card Component
function PlayerCard({ player, index, onAccuse, onSelect, isSelectMode, selectLabel }: {
    player: PlayerStatus; index: number; onAccuse?: () => void; onSelect?: () => void; isSelectMode?: boolean; selectLabel?: string
}) {
    if (!player.isAlive) {
        return (
            <div className="p-2 rounded-lg bg-muted/30 opacity-50 text-center">
                <Skull className="h-3 w-3 mx-auto mb-1" />
                <span className="text-xs line-through">{player.name}</span>
                {player.isWitch && <div className="text-xs text-red-500">🧙‍♀️</div>}
            </div>
        )
    }
    return (
        <div className={cn("p-2 rounded-lg text-center transition-all", player.hasBlackCat ? "bg-gray-800 border border-gray-600" : "bg-muted", isSelectMode && "cursor-pointer hover:ring-2 hover:ring-primary active:scale-95")} onClick={isSelectMode ? onSelect : undefined}>
            <div className="text-sm font-medium truncate">
                {player.hasBlackCat && "🐈‍⬛"}{player.hasGavelToken && "🛡️"}{player.hasConfessed && "⛪"} {player.name}
            </div>
            <div className="flex justify-center gap-0.5 mt-1">
                {Array.from({ length: 7 }).map((_, i) => (<div key={i} className={cn("w-1.5 h-1.5 rounded-full", i < player.accusations ? "bg-red-500" : "bg-gray-600")} />))}
            </div>
            <div className="text-xs text-muted-foreground">{player.tryalCardsRevealed}/5</div>
            {onAccuse && !isSelectMode && <Button size="sm" variant="outline" className="mt-1 h-5 text-xs w-full" onClick={(e) => { e.stopPropagation(); onAccuse() }}>+1</Button>}
            {isSelectMode && <div className="text-xs text-primary mt-1 font-medium">{selectLabel}</div>}
        </div>
    )
}

// Player Grid
function PlayerPanel({ gameState, onAccuse, onSelectPlayer, selectMode, selectLabel }: { gameState: SalemGameState; onAccuse?: (i: number) => void; onSelectPlayer?: (i: number) => void; selectMode?: boolean; selectLabel?: string }) {
    const alive = gameState.players.filter(p => p.isAlive).length
    return (
        <div className="p-3 border-b bg-background/95">
            <div className="flex items-center justify-between mb-2 text-sm">
                <span><Users className="h-4 w-4 inline mr-1" />{alive}/{gameState.players.length} | รอบ {gameState.roundNumber}</span>
                <span className="text-red-500">🧙‍♀️ {gameState.witchesRevealed}/{gameState.totalWitches}</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {gameState.players.map((p, i) => (<PlayerCard key={i} player={p} index={i} onAccuse={onAccuse ? () => onAccuse(i) : undefined} onSelect={onSelectPlayer ? () => onSelectPlayer(i) : undefined} isSelectMode={selectMode && p.isAlive} selectLabel={selectLabel} />))}
            </div>
        </div>
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

    const [notesOpen, setNotesOpen] = useState(false)
    const [showPlayerPanel, setShowPlayerPanel] = useState(false)
    const [selectMode, setSelectMode] = useState<"blackcat" | "target" | "protect" | "confess" | "reveal" | null>(null)
    const [gameState, setGameState] = useState<SalemGameState | null>(null)
    const [currentGamePhase, setCurrentGamePhase] = useState<GamePhase>("setup")
    const [dawnResult, setDawnResult] = useState<{ wasProtected: boolean; wasConfessed: boolean; victim: string | null; victimDied: boolean } | null>(null)
    const [winner, setWinner] = useState<"town" | "witch" | null>(null)
    const [revealDialog, setRevealDialog] = useState<{ playerName: string; playerIndex: number } | null>(null)
    const [conspiracyResult, setConspiracyResult] = useState<string | null>(null)

    useEffect(() => { if (settings && !gameState) setGameState(initializeGameState(settings)) }, [settings, gameState])

    const { phases, allSteps } = useMemo(() => {
        if (!settings) return { phases: [], allSteps: [] }
        const all = salemScriptFactory(settings)
        let filtered: Phase[] = []
        switch (currentGamePhase) {
            case "setup": filtered = all.filter(p => p.turnLabel === "Setup"); break
            case "first_night": filtered = all.filter(p => p.turnLabel === "คืนแรก"); break
            case "day": filtered = all.filter(p => p.turnLabel === "กลางวัน"); break
            case "night": filtered = all.filter(p => p.turnLabel === "กลางคืน"); break
            case "conspiracy": filtered = all.filter(p => p.turnLabel === "Conspiracy"); break
            case "death": filtered = all.filter(p => p.turnLabel === "Death"); break
            default: filtered = all
        }
        const steps = filtered.flatMap((phase, pi) => phase.steps.map((step, si) => ({ ...step, phaseIndex: pi, stepIndex: si, turnLabel: phase.turnLabel })))
        return { phases: filtered, allSteps: steps }
    }, [settings, currentGamePhase])

    const currentGlobalIndex = useMemo(() => {
        if (!session) return 0
        let idx = 0
        for (let p = 0; p < session.phaseIndex; p++) idx += phases[p]?.steps.length || 0
        return idx + session.stepIndex
    }, [session, phases])

    const currentPhase = phases[session?.phaseIndex || 0]
    const activeStep = allSteps[currentGlobalIndex]

    const transitionToPhase = useCallback((newPhase: GamePhase) => {
        setCurrentGamePhase(newPhase)
        if (activeSessionId) updateSession(activeSessionId, s => { s.phaseIndex = 0; s.stepIndex = 0 })
    }, [activeSessionId, updateSession])

    const handlePhaseEnd = useCallback(() => {
        if (!gameState) return
        switch (currentGamePhase) {
            case "setup": transitionToPhase("first_night"); break
            case "first_night": setGameState(prev => prev ? { ...prev, roundNumber: 1 } : prev); transitionToPhase("day"); break
            case "day": break // User manually triggers night/conspiracy
            case "night":
                const result = resolveNight(gameState)
                setGameState(result.newState)
                setDawnResult(result)
                const win = checkWinCondition(result.newState)
                if (win) setWinner(win)
                break
            case "conspiracy": transitionToPhase("day"); break
            case "death": transitionToPhase("day"); break
        }
    }, [currentGamePhase, gameState, transitionToPhase])

    const handleStepClick = useCallback((globalIndex: number) => {
        if (!activeSessionId || !phases.length) return
        triggerHaptic()
        let remaining = globalIndex
        for (let p = 0; p < phases.length; p++) {
            if (remaining < phases[p].steps.length) { updateSession(activeSessionId, s => { s.phaseIndex = p; s.stepIndex = remaining }); return }
            remaining -= phases[p].steps.length
        }
    }, [activeSessionId, phases, updateSession])

    const handleNext = useCallback(() => {
        if (!activeSessionId || !phases.length) return
        triggerHaptic()
        const next = currentGlobalIndex + 1
        if (next >= allSteps.length) { handlePhaseEnd(); return }
        handleStepClick(next)
    }, [activeSessionId, currentGlobalIndex, allSteps.length, handleStepClick, handlePhaseEnd])

    const handleBack = useCallback(() => { if (currentGlobalIndex > 0) { triggerHaptic(); handleStepClick(currentGlobalIndex - 1) } }, [currentGlobalIndex, handleStepClick])

    const handleDawnContinue = () => { setDawnResult(null); if (dawnResult?.victimDied) transitionToPhase("death"); else transitionToPhase("day") }

    const handleAccuse = (i: number) => {
        if (!gameState) return
        const { newState, shouldReveal } = addAccusation(gameState, i)
        setGameState(newState)
        if (shouldReveal) setRevealDialog({ playerName: newState.players[i].name, playerIndex: i })
    }

    const handleReveal = (isWitch: boolean) => {
        if (!gameState || !revealDialog) return
        const newState = revealTryalCard(gameState, revealDialog.playerIndex, isWitch)
        setGameState(newState)
        setRevealDialog(null)
        const win = checkWinCondition(newState)
        if (win) setWinner(win)
        if (!newState.players[revealDialog.playerIndex].isAlive) transitionToPhase("death")
    }

    const handleSelectPlayer = (i: number) => {
        if (!gameState || !selectMode) return
        if (selectMode === "blackcat") setGameState(setBlackCatHolder(gameState, i))
        else if (selectMode === "protect") setGameState(setGavelToken(gameState, i))
        else if (selectMode === "target") setGameState(prev => prev ? { ...prev, witchTarget: prev.players[i].name } : prev)
        else if (selectMode === "confess") { const ns = playerConfess(gameState, i); setGameState(ns); if (ns.players[i].tryalCardsRevealed >= 5) transitionToPhase("death") }
        setSelectMode(null); setShowPlayerPanel(false)
    }

    const handleConspiracy = () => {
        if (!gameState) return
        const { newState, revealedPlayer } = conspiracyReveal(gameState)
        setGameState(newState)
        if (revealedPlayer) setConspiracyResult(revealedPlayer)
        transitionToPhase("conspiracy")
    }

    const handleCheckpointSave = (cp: Checkpoint) => { addCheckpointFn(cp); handleNext() }

    if (!session || !settings || !gameState) return <div className="h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">ไม่พบเซสชัน</p></div>

    return (
        <div className="h-screen w-full flex flex-col bg-background fixed inset-0">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur z-10">
                <Sheet><SheetTrigger asChild><Button variant="ghost" size="icon"><History className="h-5 w-5" /></Button></SheetTrigger>
                    <SheetContent className="overflow-y-auto"><div className="space-y-4 mt-8"><h3 className="font-bold">Script</h3>
                        {phases.map((phase, pi) => (<div key={phase.id}><p className="text-sm font-semibold text-primary">{phase.title_th}</p>
                            {phase.steps.map((step, si) => { const gi = phases.slice(0, pi).reduce((a, p) => a + p.steps.length, 0) + si; return <button key={step.id} onClick={() => handleStepClick(gi)} className={cn("block w-full text-left text-xs py-1 px-2 rounded truncate", gi === currentGlobalIndex ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted")}>{step.text_th.slice(0, 30)}...</button> })}
                        </div>))}
                        <div className="border-t pt-4 space-y-2"><h4 className="text-sm font-semibold">Jump Phase:</h4>
                            <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" onClick={() => transitionToPhase("day")}><Sun className="h-3 w-3 mr-1" />Day</Button>
                                <Button size="sm" variant="outline" onClick={() => transitionToPhase("night")}><Moon className="h-3 w-3 mr-1" />Night</Button>
                            </div>
                        </div>
                    </div></SheetContent>
                </Sheet>
                <div className="text-center flex-1"><h2 className="font-bold text-sm">{currentPhase?.title_th || "Salem 1692"}</h2><p className="text-xs text-muted-foreground">รอบ {gameState.roundNumber} • {currentGlobalIndex + 1}/{allSteps.length}</p></div>
                <Button variant={showPlayerPanel ? "default" : "ghost"} size="icon" onClick={() => setShowPlayerPanel(!showPlayerPanel)}><Users className="h-5 w-5" /></Button>
            </header>

            {showPlayerPanel && <PlayerPanel gameState={gameState} onAccuse={currentGamePhase === "day" ? handleAccuse : undefined} onSelectPlayer={selectMode ? handleSelectPlayer : undefined} selectMode={!!selectMode} selectLabel={selectMode === "blackcat" ? "🐈‍⬛" : selectMode === "target" ? "💀" : selectMode === "protect" ? "🛡️" : selectMode === "confess" ? "⛪" : undefined} />}

            {/* Action Bar */}
            {(currentGamePhase === "night" || currentGamePhase === "first_night") && (
                <div className="p-2 border-b bg-muted/50 flex gap-2 justify-center flex-wrap">
                    <Button size="sm" variant={gameState.blackCatHolder >= 0 ? "secondary" : "default"} onClick={() => { setShowPlayerPanel(true); setSelectMode("blackcat") }}>🐈‍⬛ Cat{gameState.blackCatHolder >= 0 && " ✓"}</Button>
                    {currentGamePhase === "night" && <><Button size="sm" variant={gameState.witchTarget ? "secondary" : "destructive"} onClick={() => { setShowPlayerPanel(true); setSelectMode("target") }}>💀 Kill{gameState.witchTarget && ` ✓`}</Button>
                        {settings.hasConstable && <Button size="sm" variant={gameState.constableProtected ? "secondary" : "outline"} onClick={() => { setShowPlayerPanel(true); setSelectMode("protect") }}>🛡️ Protect{gameState.constableProtected && " ✓"}</Button>}
                        <Button size="sm" variant="outline" onClick={() => { setShowPlayerPanel(true); setSelectMode("confess") }}><Hand className="h-3 w-3 mr-1" />⛪ Confess</Button></>}
                </div>
            )}
            {currentGamePhase === "day" && (
                <div className="p-2 border-b bg-muted/50 flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={() => transitionToPhase("night")}><Moon className="h-3 w-3 mr-1" />Night Card</Button>
                    <Button size="sm" variant="outline" onClick={handleConspiracy}>🔀 Conspiracy</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowPlayerPanel(!showPlayerPanel)}><Users className="h-3 w-3 mr-1" />Accuse</Button>
                </div>
            )}

            <RollingLyricView steps={allSteps} activeIndex={currentGlobalIndex} onStepClick={handleStepClick} onCheckpointSave={handleCheckpointSave} onCheckpointSkip={handleNext} />

            {/* Footer */}
            <div className="p-4 pb-8 border-t bg-background/95 backdrop-blur z-10 flex gap-4 items-center justify-between">
                <Button variant="outline" size="icon" onClick={handleBack} className="h-14 w-14 rounded-full" disabled={currentGlobalIndex === 0}><ChevronLeft /></Button>
                <Button className="h-14 flex-1 rounded-full text-lg shadow-lg" onClick={handleNext}><Check className="mr-2 h-6 w-6" />ทำเสร็จแล้ว</Button>
                {settings.notesEnabled ? <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full" onClick={() => setNotesOpen(true)}><NotebookPen className="h-5 w-5" /></Button> : <div className="w-12" />}
            </div>

            {notesOpen && activeStep && <NotesSheet onClose={() => setNotesOpen(false)} currentCtx={{ phaseId: String(session.phaseIndex), stepId: activeStep.id, turnLabel: activeStep.turnLabel || "" }} />}

            {/* Dawn Result */}
            <Dialog open={!!dawnResult}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="text-center text-xl">🌅 ผลคืนนี้</DialogTitle></DialogHeader>
                <div className="text-center py-6 space-y-4">
                    {dawnResult?.victim ? (dawnResult.wasProtected ? (<><div className="text-6xl">🛡️</div><p><b>{dawnResult.victim}</b> ถูกโจมตีแต่...</p><p className="text-green-500 font-bold text-xl">ได้รับการปกป้องจาก Constable!</p></>)
                        : dawnResult.wasConfessed ? (<><div className="text-6xl">⛪</div><p><b>{dawnResult.victim}</b> ถูกโจมตีแต่...</p><p className="text-green-500 font-bold text-xl">สารภาพบาปแล้ว! (Immune)</p></>)
                            : (<><div className="text-6xl">💀</div><p className="text-red-500 font-bold text-xl">{dawnResult.victim}</p><p>ถูกแม่มดสังหาร! เปิด Tryal Card 1 ใบ</p>{dawnResult.victimDied && <><p className="text-lg font-bold mt-4">{SalemStrings.DEATH.LAST_WORDS}</p><p className="text-sm text-muted-foreground">{SalemStrings.DEATH.SILENCE}</p></>}</>))
                        : (<><div className="text-6xl">😴</div><p>คืนนี้ไม่มีใครตาย</p></>)}
                </div>
                <DialogFooter><Button onClick={handleDawnContinue} className="w-full"><Sun className="mr-2 h-4 w-4" />เข้าสู่กลางวัน</Button></DialogFooter>
            </DialogContent></Dialog>

            {/* Win */}
            <Dialog open={!!winner}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="text-center text-xl">🏆 จบเกม!</DialogTitle></DialogHeader>
                <div className="text-center py-6 space-y-4">{winner === "town" ? (<><div className="text-6xl">🎉</div><p className="text-2xl font-bold text-green-500">ชาวเมืองชนะ!</p></>) : (<><div className="text-6xl">🧙‍♀️</div><p className="text-2xl font-bold text-red-500">แม่มดชนะ!</p></>)}</div>
                <DialogFooter><Button onClick={() => navigate("/salem/summary")} className="w-full">ดูสรุป</Button></DialogFooter>
            </DialogContent></Dialog>

            {/* Tryal Reveal */}
            <Dialog open={!!revealDialog}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>เปิด Tryal Card</DialogTitle></DialogHeader>
                <p className="text-center py-4"><b>{revealDialog?.playerName}</b> ถูกกล่าวหาครบ 7 ครั้ง!<br />เปิด Tryal Card แล้วเจออะไร?</p>
                <DialogFooter className="flex gap-2"><Button variant="destructive" onClick={() => handleReveal(true)} className="flex-1">🧙‍♀️ Witch!</Button><Button variant="outline" onClick={() => handleReveal(false)} className="flex-1">😇 Not Witch</Button></DialogFooter>
            </DialogContent></Dialog>

            {/* Conspiracy Black Cat */}
            <Dialog open={!!conspiracyResult} onOpenChange={() => setConspiracyResult(null)}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>🔀 Conspiracy - Black Cat</DialogTitle></DialogHeader>
                <div className="text-center py-4"><p className="text-lg"><b>{conspiracyResult}</b> ถือ Black Cat อยู่!</p><p className="text-red-500 font-bold mt-2">ต้องเปิด Tryal Card 1 ใบก่อน!</p></div>
                <DialogFooter><Button onClick={() => setConspiracyResult(null)} className="w-full">เข้าใจแล้ว</Button></DialogFooter>
            </DialogContent></Dialog>
        </div>
    )
}
