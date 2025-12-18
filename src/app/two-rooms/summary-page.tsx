import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, RotateCcw } from "lucide-react"

export function TwoRoomsSummaryPage() {
    const navigate = useNavigate()
    const endSession = useAppStore(state => state.endSession)

    const handlePlayAgain = () => {
        endSession()
        navigate("/two-rooms/setup")
    }

    const handleHome = () => {
        endSession()
        navigate("/")
    }

    return (
        <div className="container mx-auto max-w-lg p-4 space-y-6 py-12">
            <div className="text-center space-y-4">
                <div className="text-6xl">🎭</div>
                <h1 className="text-3xl font-bold">เกมจบแล้ว!</h1>
                <p className="text-muted-foreground">
                    ขอบคุณที่เล่นกับ Board Game MASTER
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>📊 สรุปเกม</CardTitle>
                    <CardDescription>Two Rooms and a Boom</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-blue-500/10 rounded-lg p-4">
                            <div className="text-3xl">🔵</div>
                            <div className="font-bold">ทีมน้ำเงิน</div>
                            <div className="text-sm text-muted-foreground">ปกป้อง President</div>
                        </div>
                        <div className="bg-red-500/10 rounded-lg p-4">
                            <div className="text-3xl">🔴</div>
                            <div className="font-bold">ทีมแดง</div>
                            <div className="text-sm text-muted-foreground">ระเบิด President</div>
                        </div>
                    </div>

                    <div className="text-center py-4">
                        <p className="text-lg">ใครชนะในเกมนี้?</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            President และ Bomber อยู่ห้องเดียวกันไหม?
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            className="h-16 border-blue-500 text-blue-500 hover:bg-blue-500/10"
                        >
                            🔵 Blue ชนะ!
                        </Button>
                        <Button
                            variant="outline"
                            className="h-16 border-red-500 text-red-500 hover:bg-red-500/10"
                        >
                            🔴 Red ชนะ!
                        </Button>
                    </div>
                </CardContent>
            </Card>

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
