import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import type { TwoRoomsSettings } from "@/games/two-rooms/schema"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, RotateCcw, Trophy, Users, Clock, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

type Winner = "BLUE" | "RED" | null

export function TwoRoomsSummaryPage() {
    const navigate = useNavigate()
    const session = useAppStore(state =>
        state.activeSessionId ? state.sessions[state.activeSessionId] : null
    )
    const endSession = useAppStore(state => state.endSession)
    const updateSession = useAppStore(state => state.updateSession)

    const [winner, setWinner] = useState<Winner>(null)
    const [showConfetti, setShowConfetti] = useState(false)

    // Get game stats from session
    const settings = session?.settings as TwoRoomsSettings | undefined
    const playerCount = settings?.playerCount || 0
    const totalRounds = settings?.config.rounds.length || 0
    const totalTime = settings?.config.rounds.reduce(
        (acc, r) => acc + r.duration_sec, 0
    ) || 0

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        return `${mins} นาที`
    }

    const handleSelectWinner = (team: Winner) => {
        if (!session || !team) return

        setWinner(team)
        setShowConfetti(true)

        // Record winner to session
        if (session.id) {
            updateSession(session.id, s => {
                s.notes = [...(s.notes || []), {
                    id: crypto.randomUUID(),
                    text: `🏆 ผู้ชนะ: ${team === "BLUE" ? "ทีมน้ำเงิน 🔵" : "ทีมแดง 🔴"}`,
                    phaseIndex: s.phaseIndex,
                    stepIndex: s.stepIndex,
                    timestamp: Date.now()
                }]
            })
        }

        // Hide confetti after animation
        setTimeout(() => setShowConfetti(false), 3000)
    }

    const handlePlayAgain = () => {
        endSession()
        navigate("/two-rooms/setup")
    }

    const handleHome = () => {
        endSession()
        navigate("/")
    }

    // Show loading if no session data
    useEffect(() => {
        if (!session) {
            navigate("/two-rooms/setup")
        }
    }, [session, navigate])

    if (!session) return null

    return (
        <div className="container mx-auto max-w-lg p-4 space-y-6 py-12 relative overflow-hidden">
            {/* Confetti Animation */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50">
                    <div className="absolute inset-0 animate-pulse">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "absolute text-4xl animate-bounce",
                                    winner === "BLUE" ? "text-blue-500" : "text-red-500"
                                )}
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 0.5}s`,
                                    animationDuration: `${0.5 + Math.random() * 0.5}s`
                                }}
                            >
                                {winner === "BLUE" ? "🔵" : "🔴"}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="text-center space-y-4">
                <div className="text-6xl">{winner ? "🏆" : "🎭"}</div>
                <h1 className="text-3xl font-bold">
                    {winner ? (
                        winner === "BLUE" ? "🔵 ทีมน้ำเงินชนะ!" : "🔴 ทีมแดงชนะ!"
                    ) : (
                        "เกมจบแล้ว!"
                    )}
                </h1>
                {winner && (
                    <p className="text-lg text-muted-foreground">
                        {winner === "BLUE"
                            ? "President รอดชีวิต! 🛡️"
                            : "BOOM! ระเบิดสังหารสำเร็จ! 💥"
                        }
                    </p>
                )}
            </div>

            {/* Game Stats */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        📊 สถิติเกม
                    </CardTitle>
                    <CardDescription>Two Rooms and a Boom</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-muted/50 rounded-lg p-4">
                            <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                            <div className="text-2xl font-bold">{playerCount}</div>
                            <div className="text-xs text-muted-foreground">ผู้เล่น</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                            <Layers className="w-6 h-6 mx-auto mb-2 text-primary" />
                            <div className="text-2xl font-bold">{totalRounds}</div>
                            <div className="text-xs text-muted-foreground">รอบ</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                            <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
                            <div className="text-2xl font-bold">{formatTime(totalTime)}</div>
                            <div className="text-xs text-muted-foreground">เวลารวม</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Winner Selection (if not yet selected) */}
            {!winner && (
                <Card>
                    <CardHeader>
                        <CardTitle>🎯 ประกาศผู้ชนะ</CardTitle>
                        <CardDescription>President และ Bomber อยู่ห้องเดียวกันไหม?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-blue-500/10 rounded-lg p-4">
                                <div className="text-3xl">🔵</div>
                                <div className="font-bold">ทีมน้ำเงิน</div>
                                <div className="text-xs text-muted-foreground">President คนละห้อง</div>
                            </div>
                            <div className="bg-red-500/10 rounded-lg p-4">
                                <div className="text-3xl">🔴</div>
                                <div className="font-bold">ทีมแดง</div>
                                <div className="text-xs text-muted-foreground">Bomber อยู่ด้วย</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                size="lg"
                                onClick={() => handleSelectWinner("BLUE")}
                                className="h-16 bg-blue-600 hover:bg-blue-700 text-white text-lg"
                            >
                                🔵 Blue ชนะ!
                            </Button>
                            <Button
                                size="lg"
                                onClick={() => handleSelectWinner("RED")}
                                className="h-16 bg-red-600 hover:bg-red-700 text-white text-lg"
                            >
                                🔴 Red ชนะ!
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Winner Display (after selection) */}
            {winner && (
                <Card className={cn(
                    "border-2",
                    winner === "BLUE" ? "border-blue-500 bg-blue-500/5" : "border-red-500 bg-red-500/5"
                )}>
                    <CardContent className="p-6 text-center">
                        <div className="text-5xl mb-4">
                            {winner === "BLUE" ? "🛡️" : "💣"}
                        </div>
                        <p className="text-xl font-bold">
                            {winner === "BLUE"
                                ? "ทีมน้ำเงินปกป้อง President สำเร็จ!"
                                : "Bomber ระเบิด President สำเร็จ!"
                            }
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="space-y-3">
                <Button
                    onClick={handlePlayAgain}
                    className="w-full h-14 text-lg"
                    variant="default"
                >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    เล่นอีกรอบ
                </Button>
                <Button
                    onClick={handleHome}
                    variant="outline"
                    className="w-full"
                >
                    <Home className="w-5 h-5 mr-2" />
                    กลับหน้าหลัก
                </Button>
            </div>
        </div>
    )
}
