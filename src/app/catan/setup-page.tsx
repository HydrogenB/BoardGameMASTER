import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ChevronLeft } from "lucide-react"
import type { CatanSettings, BoardMode } from "@/games/catan/types"
import { getDefaultCatanSettings } from "@/games/catan/types"
import { CatanStrings } from "@/games/catan/strings.th"

const STORAGE_KEY = "catan_last_settings"

export function CatanSetupPage() {
    const navigate = useNavigate()
    const createSession = useAppStore(state => state.createSession)

    // Load last settings or use defaults
    const [settings, setSettings] = useState<CatanSettings>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                return { ...getDefaultCatanSettings(), ...JSON.parse(saved) }
            }
        } catch { /* ignore */ }
        return getDefaultCatanSettings()
    })

    // Persist settings on change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    }, [settings])

    // Sync player names array with player count
    useEffect(() => {
        if (settings.playerNames.length !== settings.playerCount) {
            const names = [...settings.playerNames]
            while (names.length < settings.playerCount) {
                names.push(`ผู้เล่น ${String.fromCharCode(65 + names.length)}`)
            }
            while (names.length > settings.playerCount) {
                names.pop()
            }
            setSettings((s: CatanSettings) => ({ ...s, playerNames: names }))
        }
    }, [settings.playerCount])

    const handleStart = () => {
        createSession("catan", settings)
        navigate("/catan/play")
    }

    const updateSetting = <K extends keyof CatanSettings>(key: K, value: CatanSettings[K]) => {
        setSettings((s: CatanSettings) => ({ ...s, [key]: value }))
    }

    const updatePlayerName = (idx: number, name: string) => {
        const newNames = [...settings.playerNames]
        newNames[idx] = name
        updateSetting("playerNames", newNames)
    }

    const adjustPlayerCount = (delta: number) => {
        const newCount = Math.max(3, Math.min(6, settings.playerCount + delta)) as 3 | 4 | 5 | 6
        updateSetting("playerCount", newCount)
    }

    return (
        <div className="container mx-auto p-4 max-w-md min-h-screen flex flex-col pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-2xl font-bold">ตั้งค่าเกม Catan</h1>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto">
                {/* Players Section */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">ผู้เล่น ({settings.playerCount} คน)</CardTitle>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => adjustPlayerCount(-1)} disabled={settings.playerCount <= 3}>-</Button>
                                <Button size="sm" variant="outline" onClick={() => adjustPlayerCount(1)} disabled={settings.playerCount >= 4}>+</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {settings.playerNames.map((name: string, i: number) => (
                            <Input
                                key={i}
                                value={name}
                                onChange={(e) => updatePlayerName(i, e.target.value)}
                                placeholder={`ผู้เล่น ${String.fromCharCode(65 + i)}`}
                            />
                        ))}
                    </CardContent>
                </Card>

                {/* Victory & Board Mode */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">กติกา</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>คะแนนชนะ (Victory Points)</Label>
                            <Input
                                type="number"
                                value={settings.victoryPointsTarget}
                                onChange={(e) => updateSetting("victoryPointsTarget", Math.max(8, Math.min(12, Number(e.target.value))))}
                                min={8}
                                max={12}
                                className="text-lg py-6"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>โหมดกระดาน</Label>
                            <div className="grid grid-cols-1 gap-2">
                                {(["BEGINNER", "RANDOMIZED", "MANUAL"] as BoardMode[]).map((mode) => (
                                    <Button
                                        key={mode}
                                        variant={settings.boardMode === mode ? "default" : "outline"}
                                        className="justify-start h-auto py-3"
                                        onClick={() => updateSetting("boardMode", mode)}
                                    >
                                        <div className="text-left">
                                            <div className="font-semibold">{mode}</div>
                                            <div className="text-xs opacity-70">{CatanStrings.BOARD_MODE[mode]}</div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <Label htmlFor="friendly-robber" className="flex flex-col">
                                <span>Friendly Robber</span>
                                <span className="text-xs text-muted-foreground font-normal">ห้ามขโมยจากผู้เล่นที่มี ≤2 VP</span>
                            </Label>
                            <Switch
                                id="friendly-robber"
                                checked={settings.friendlyRobberEnabled}
                                onCheckedChange={(v) => updateSetting("friendlyRobberEnabled", v)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Timer */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">ตัวจับเวลา</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="timer-toggle">เปิดใช้งาน Timer</Label>
                            <Switch
                                id="timer-toggle"
                                checked={settings.turnTimerEnabled}
                                onCheckedChange={(v) => updateSetting("turnTimerEnabled", v)}
                            />
                        </div>
                        {settings.turnTimerEnabled && (
                            <div className="space-y-2">
                                <Label>เวลาต่อตา (วินาที)</Label>
                                <Input
                                    type="number"
                                    value={settings.turnTimerSeconds}
                                    onChange={(e) => updateSetting("turnTimerSeconds", Math.max(60, Math.min(180, Number(e.target.value))))}
                                    min={60}
                                    max={180}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Features */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">ฟีเจอร์ช่วยเหลือ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>แสดงคำแนะนำเทรด</Label>
                            <Switch checked={settings.enableTradePrompts} onCheckedChange={(v) => updateSetting("enableTradePrompts", v)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>แสดงคำแนะนำพอร์ต</Label>
                            <Switch checked={settings.enablePortReminders} onCheckedChange={(v) => updateSetting("enablePortReminders", v)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>เปิดใช้งานโน้ต</Label>
                            <Switch checked={settings.notesEnabled} onCheckedChange={(v) => updateSetting("notesEnabled", v)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Quick Tags</Label>
                            <Switch checked={settings.quickTagsEnabled} onCheckedChange={(v) => updateSetting("quickTagsEnabled", v)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Checkpoints (บันทึกสถานะ)</Label>
                            <Switch checked={settings.checkpointsEnabled} onCheckedChange={(v) => updateSetting("checkpointsEnabled", v)} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t">
                <Button size="lg" className="w-full text-xl py-8 max-w-md mx-auto block" onClick={handleStart}>
                    {CatanStrings.UI.START_GAME}
                </Button>
            </div>
        </div>
    )
}
