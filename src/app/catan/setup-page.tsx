import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ChevronLeft } from "lucide-react"
import type { CatanSettings } from "@/games/catan/types"

export function CatanSetupPage() {
    const navigate = useNavigate()
    const createSession = useAppStore(state => state.createSession)

    const [winningScore, setWinningScore] = useState(10)
    const [ckExpansion, setCkExpansion] = useState(false)
    const [sfExpansion, setSfExpansion] = useState(false)
    const [players, setPlayers] = useState<string[]>(["Player 1", "Player 2", "Player 3"])

    const handleStart = () => {
        const settings: CatanSettings = {
            winningScore,
            expansionCitiesAndKnights: ckExpansion,
            expansionSeafarers: sfExpansion,
            players
        }

        createSession("catan", settings)
        navigate("/catan/play")
    }

    const updatePlayer = (idx: number, name: string) => {
        const newPlayers = [...players]
        newPlayers[idx] = name
        setPlayers(newPlayers)
    }

    const addPlayer = () => {
        if (players.length < 6) {
            setPlayers([...players, `Player ${players.length + 1}`])
        }
    }

    const removePlayer = () => {
        if (players.length > 3) {
            setPlayers(players.slice(0, -1))
        }
    }

    return (
        <div className="container mx-auto p-4 max-w-md h-screen flex flex-col">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-2xl font-bold">ตั้งค่าเกม Catan</h1>
            </div>

            <Card className="flex-1 border-none shadow-none bg-transparent overflow-y-auto">
                <CardHeader>
                    <CardTitle>กำหนดการเล่น</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>ผู้เล่น ({players.length} คน)</Label>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={removePlayer} disabled={players.length <= 3}>-</Button>
                                <Button size="sm" variant="outline" onClick={addPlayer} disabled={players.length >= 6}>+</Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {players.map((p, i) => (
                                <Input
                                    key={i}
                                    value={p}
                                    onChange={(e) => updatePlayer(i, e.target.value)}
                                    placeholder={`Player ${i + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>คะแนนชนะ (Winning Points)</Label>
                        <Input
                            type="number"
                            value={winningScore}
                            onChange={(e) => setWinningScore(Number(e.target.value))}
                            className="text-lg py-6"
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-semibold text-muted-foreground">Expansion (ส่วนเสริม)</h3>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="ck-mode" className="flex flex-col">
                                <span>Cities & Knights</span>
                                <span className="text-xs text-muted-foreground font-normal">เพิ่มสินค้าและอัศวิน</span>
                            </Label>
                            <Switch id="ck-mode" checked={ckExpansion} onCheckedChange={setCkExpansion} />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="sf-mode" className="flex flex-col">
                                <span>Seafarers</span>
                                <span className="text-xs text-muted-foreground font-normal">แผนที่ทางทะเล</span>
                            </Label>
                            <Switch id="sf-mode" checked={sfExpansion} onCheckedChange={setSfExpansion} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Button size="lg" className="w-full text-xl py-8 mt-auto" onClick={handleStart}>
                เริ่มเกม
            </Button>
        </div>
    )
}
