import { Link, useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, RotateCcw } from "lucide-react"

export function LandingPage() {
    const navigate = useNavigate()
    const activeSessionId = useAppStore(state => state.activeSessionId)
    const sessions = useAppStore(state => state.sessions)
    // const resumeSession = useAppStore(state => state.resumeSession) // Unused

    const activeSession = activeSessionId ? sessions[activeSessionId] : null

    const handleResume = () => {
        if (activeSessionId) {
            if (activeSession?.gameId === 'werewolf') {
                navigate('/werewolf/play')
            }
        }
    }

    return (
        <div className="container mx-auto max-w-md p-4 space-y-8 py-12">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-primary">Board Game MASTER</h1>
                <p className="text-muted-foreground">ผู้ช่วยดำเนินเกมบอร์ดเกม</p>
            </div>

            {activeSession && activeSession.status === 'IN_PROGRESS' && (
                <Card className="border-primary/50 bg-primary/5 shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <RotateCcw className="w-4 h-4" />
                            เล่นต่อจากเดิม
                        </CardTitle>
                        <CardDescription>
                            {activeSession.gameId === 'werewolf' ? 'เกมมนุษย์หมาป่า' : activeSession.gameId} • {new Date(activeSession.updatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full" onClick={handleResume}>
                            กลับไปเล่นต่อ
                        </Button>
                    </CardFooter>
                </Card>
            )}

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">เลือกเกม</h2>

                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-2xl">Werewolf</CardTitle>
                        </div>
                        <CardDescription className="text-base">เกมจิตวิทยามนุษย์หมาป่า</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            เกมปาร์ตี้บลัฟฟ์ยอดฮิต ต้องใช้ไหวพริบ การเจรจา และการจับโกหก
                            รองรับผู้เล่น 5-20 คน
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Link to="/werewolf/setup" className="w-full">
                            <Button className="w-full text-md h-12" size="lg">
                                <Play className="mr-2 w-5 h-5" />
                                เริ่มเกมใหม่
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>

                <Card className="opacity-60 grayscale cursor-not-allowed">
                    <CardHeader>
                        <CardTitle>Catan</CardTitle>
                        <CardDescription>นักบุกเบิกแห่ง Catan</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button variant="outline" disabled className="w-full">เร็วๆ นี้</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
