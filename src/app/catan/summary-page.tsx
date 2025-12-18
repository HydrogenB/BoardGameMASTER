import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Home, Play, CheckCircle } from "lucide-react"
import { CatanStrings } from "@/games/catan/strings.th"
import type { CatanSettings } from "@/games/catan/types"

export function CatanSummaryPage() {
    const navigate = useNavigate()
    const activeSessionId = useAppStore(state => state.activeSessionId)
    const sessions = useAppStore(state => state.sessions)
    const updateSession = useAppStore(state => state.updateSession)

    const session = activeSessionId ? sessions[activeSessionId] : null
    const settings = session?.settings as CatanSettings | undefined

    if (!session || !settings) {
        return (
            <div className="flex items-center justify-center h-screen flex-col gap-4">
                <h1 className="text-xl font-bold">ไม่พบข้อมูลเกม</h1>
                <Button onClick={() => navigate("/")}>กลับหน้าหลัก</Button>
            </div>
        )
    }

    const handleExport = () => {
        const date = new Date().toISOString().split('T')[0]
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session, null, 2))
        const downloadAnchorNode = document.createElement('a')
        downloadAnchorNode.setAttribute("href", dataStr)
        downloadAnchorNode.setAttribute("download", `catan_session_${date}_${activeSessionId}.json`)
        document.body.appendChild(downloadAnchorNode)
        downloadAnchorNode.click()
        downloadAnchorNode.remove()
    }

    const handleEndGame = () => {
        updateSession(activeSessionId!, (s) => {
            s.status = "COMPLETED"
        })
        navigate("/")
    }

    const handleResume = () => {
        navigate("/catan/play")
    }

    const durationStr = () => {
        const start = new Date(session.createdAt).getTime()
        const end = new Date(session.updatedAt).getTime()
        const diff = end - start
        const minutes = Math.floor(diff / 60000)
        if (minutes < 60) return `${minutes} นาที`
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        return `${hours} ชั่วโมง ${remainingMinutes} นาที`
    }

    // Get round number from phaseIndex (phases 3+ are round 1+)
    const estimatedRound = Math.max(0, session.phaseIndex - 2)

    const avgCheckpointRating = session.checkpoints.length > 0
        ? (session.checkpoints.reduce((sum, cp) => sum + cp.rating, 0) / session.checkpoints.length).toFixed(1)
        : "-"

    return (
        <div className="container mx-auto p-4 space-y-6 pb-32 max-w-md">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                    <Home className="w-5 h-5" />
                </Button>
                <h1 className="text-2xl font-bold">{CatanStrings.SUMMARY.TITLE}</h1>
            </div>

            {/* Overview Card */}
            <Card>
                <CardHeader>
                    <CardTitle>{CatanStrings.SUMMARY.OVERVIEW}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{CatanStrings.SUMMARY.PLAYERS}</span>
                        <span className="font-bold">{settings.playerCount} คน</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">ชื่อผู้เล่น</span>
                        <span className="font-medium text-right text-sm">{settings.playerNames.join(", ")}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{CatanStrings.SUMMARY.VP_TARGET}</span>
                        <span className="font-bold">{settings.victoryPointsTarget} VP</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{CatanStrings.SUMMARY.BOARD_MODE}</span>
                        <span className="font-medium">{settings.boardMode}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{CatanStrings.SUMMARY.DURATION}</span>
                        <span className="font-bold">{durationStr()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{CatanStrings.SUMMARY.ROUNDS}</span>
                        <span className="font-bold">{estimatedRound}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-muted-foreground">สถานะ</span>
                        <span className={`font-bold flex items-center gap-1 ${session.status === "COMPLETED" ? "text-green-600" : "text-yellow-600"}`}>
                            {session.status === "COMPLETED" ? (
                                <><CheckCircle className="w-4 h-4" /> จบเกมแล้ว</>
                            ) : (
                                <>กำลังเล่น</>
                            )}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Notes Card */}
            <Card>
                <CardHeader>
                    <CardTitle>{CatanStrings.SUMMARY.NOTES} ({session.notes.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-64 overflow-y-auto">
                    {session.notes.length === 0 && (
                        <p className="text-muted-foreground text-center">{CatanStrings.SUMMARY.NO_NOTES}</p>
                    )}
                    {session.notes.map(note => (
                        <div key={note.id} className="border-l-4 border-primary pl-4 py-2 bg-secondary/10 rounded-r">
                            <p className="text-lg">{note.text}</p>
                            <div className="text-xs text-muted-foreground flex gap-2 mt-1 flex-wrap">
                                <span>{note.turnLabel}</span>
                                {note.playerLabel && <span>• {note.playerLabel}</span>}
                                <span>• {new Date(note.createdAt).toLocaleTimeString('th-TH')}</span>
                            </div>
                            {note.tags.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                    {note.tags.map(tag => (
                                        <span key={tag} className="text-xs bg-primary/10 px-2 py-0.5 rounded">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Checkpoints Card */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{CatanStrings.SUMMARY.CHECKPOINTS} ({session.checkpoints.length})</CardTitle>
                        {session.checkpoints.length > 0 && (
                            <span className="text-yellow-500 font-bold">เฉลี่ย: {avgCheckpointRating}/5</span>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                    {session.checkpoints.map(cp => (
                        <div key={cp.id} className="flex justify-between items-center bg-secondary/10 p-3 rounded">
                            <span>{cp.turnLabel}</span>
                            <span className="font-bold text-yellow-500 flex items-center gap-1">
                                {cp.rating} <span className="text-xs text-muted-foreground">/ 5</span>
                            </span>
                        </div>
                    ))}
                    {session.checkpoints.length === 0 && (
                        <p className="text-muted-foreground text-center">ไม่มี Checkpoint</p>
                    )}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t space-y-2">
                <div className="max-w-md mx-auto space-y-2">
                    {session.status !== "COMPLETED" && (
                        <div className="flex gap-2">
                            <Button size="lg" className="flex-1 h-14" onClick={handleResume}>
                                <Play className="mr-2" /> {CatanStrings.UI.RESUME}
                            </Button>
                            <Button size="lg" variant="destructive" className="flex-1 h-14" onClick={handleEndGame}>
                                <CheckCircle className="mr-2" /> {CatanStrings.UI.END_GAME}
                            </Button>
                        </div>
                    )}
                    <Button size="lg" className="w-full h-14" variant="outline" onClick={handleExport}>
                        <Download className="mr-2" /> {CatanStrings.SUMMARY.EXPORT}
                    </Button>
                </div>
            </div>
        </div>
    )
}
