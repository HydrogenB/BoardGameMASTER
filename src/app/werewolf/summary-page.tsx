import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Home } from "lucide-react"

export function WerewolfSummaryPage() {
    const navigate = useNavigate()
    const activeSessionId = useAppStore(state => state.activeSessionId)
    const sessions = useAppStore(state => state.sessions)

    const session = activeSessionId ? sessions[activeSessionId] : null

    if (!session) {
        return (
            <div className="flex items-center justify-center h-screen flex-col gap-4">
                <h1 className="text-xl font-bold">ไม่พบข้อมูลเกม</h1>
                <Button onClick={() => navigate("/")}>กลับหน้าหลัก</Button>
            </div>
        )
    }

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session, null, 2))
        const downloadAnchorNode = document.createElement('a')
        downloadAnchorNode.setAttribute("href", dataStr)
        downloadAnchorNode.setAttribute("download", `werewolf_session_${activeSessionId}.json`)
        document.body.appendChild(downloadAnchorNode)
        downloadAnchorNode.click()
        downloadAnchorNode.remove()
    }

    const durationStr = () => {
        const start = new Date(session.createdAt).getTime()
        const end = new Date(session.updatedAt).getTime()
        const diff = end - start
        const minutes = Math.floor(diff / 60000)
        return `${minutes} นาที`
    }

    return (
        <div className="container mx-auto p-4 space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                    <Home className="w-5 h-5" />
                </Button>
                <h1 className="text-2xl font-bold">สรุปผลเกม</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>ข้อมูลทั่วไป</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between">
                        <span>ผู้เล่น</span>
                        <span className="font-bold">{session.settings.numberOfPlayers} คน</span>
                    </div>
                    <div className="flex justify-between">
                        <span>ระยะเวลา</span>
                        <span className="font-bold">{durationStr()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>จำนวนรอบ (คืน)</span>
                        <span className="font-bold">{session.phaseIndex}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>บันทึก ({session.notes.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {session.notes.length === 0 && <p className="text-muted-foreground text-center">ไม่มีบันทึก</p>}
                    {session.notes.map(note => (
                        <div key={note.id} className="border-l-4 border-primary pl-4 py-2 bg-secondary/10">
                            <p className="text-lg">{note.text}</p>
                            <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                                <span>{note.turnLabel}</span>
                                <span>•</span>
                                <span>{new Date(note.createdAt).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Checkpoints ({session.checkpoints.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {session.checkpoints.map(cp => (
                        <div key={cp.id} className="flex justify-between items-center bg-secondary/10 p-4 rounded text-lg">
                            <span>{cp.turnLabel}</span>
                            <span className="font-bold text-yellow-500 flex items-center gap-1">
                                {cp.rating} <span className="text-xs text-muted-foreground">/ 5</span>
                            </span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Button size="lg" className="w-full text-lg h-14" variant="outline" onClick={handleExport}>
                <Download className="mr-2" /> Export JSON
            </Button>
        </div>
    )
}
