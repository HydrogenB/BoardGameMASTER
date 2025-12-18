import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, Home, Trophy, NotebookText, Clock } from "lucide-react"
import type { SalemSettings } from "@/games/salem/types"

export function SalemSummaryPage() {
    const navigate = useNavigate()
    const activeSessionId = useAppStore(state => state.activeSessionId)
    const sessions = useAppStore(state => state.sessions)
    const endSession = useAppStore(state => state.endSession)

    const session = activeSessionId ? sessions[activeSessionId] : null
    const settings = session?.settings as SalemSettings | undefined
    const notes = session?.notes || []

    const handleFinish = () => {
        endSession()
        navigate("/")
    }

    if (!session) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <p className="text-muted-foreground">ไม่พบเซสชัน</p>
            </div>
        )
    }

    const duration = new Date(session.updatedAt).getTime() - new Date(session.createdAt).getTime()
    const minutes = Math.floor(duration / 60000)

    return (
        <div className="container mx-auto max-w-lg p-4 space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/salem/play")}>
                    <ChevronLeft />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">🔥 สรุปเกม Salem</h1>
                </div>
            </div>

            {/* Game Result */}
            <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        จบเกม!
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        เกมจบลงแล้ว ประกาศผู้ชนะและเปิดเผย Tryal Cards ทั้งหมด
                    </p>
                </CardContent>
            </Card>

            {/* Stats */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        สถิติ
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold">{settings?.playerCount || 0}</div>
                            <div className="text-sm text-muted-foreground">ผู้เล่น</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{minutes}</div>
                            <div className="text-sm text-muted-foreground">นาที</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notes */}
            {notes.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <NotebookText className="h-4 w-4" />
                            บันทึก ({notes.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {notes.map(note => (
                                <div key={note.id} className="text-sm p-2 bg-muted rounded">
                                    <p>{note.text}</p>
                                    {note.playerLabel && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            👤 {note.playerLabel}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Finish Button */}
            <Button
                className="w-full h-14 text-lg rounded-full shadow-lg"
                onClick={handleFinish}
            >
                <Home className="mr-2 h-5 w-5" />
                กลับหน้าหลัก
            </Button>
        </div>
    )
}
