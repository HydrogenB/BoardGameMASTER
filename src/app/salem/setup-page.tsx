import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ChevronLeft, Flame, Users, Minus, Plus } from "lucide-react"
import type { SalemSettings } from "@/games/salem/types"
import { getDefaultSalemSettings, SALEM_PLAYER_COUNTS } from "@/games/salem/types"
import { SalemStrings, getTryalCardCounts } from "@/games/salem/strings.th"

export function SalemSetupPage() {
    const navigate = useNavigate()
    const createSession = useAppStore(state => state.createSession)
    const lastSettings = useAppStore(state => state.lastSettings.salem) as Partial<SalemSettings> | undefined

    const [settings, setSettings] = useState<SalemSettings>(() => {
        const defaults = getDefaultSalemSettings()
        return lastSettings ? { ...defaults, ...lastSettings } : defaults
    })

    // Update player names when count changes
    useEffect(() => {
        if (settings.playerNames.length !== settings.playerCount) {
            const newNames = [...settings.playerNames]
            while (newNames.length < settings.playerCount) {
                newNames.push(`ผู้เล่น ${String.fromCharCode(65 + newNames.length)}`)
            }
            setSettings(s => ({ ...s, playerNames: newNames.slice(0, settings.playerCount) }))
        }
    }, [settings.playerCount, settings.playerNames.length])

    const counts = getTryalCardCounts(settings.playerCount)

    const handleStart = () => {
        createSession("salem", settings)
        navigate("/salem/play")
    }

    const adjustPlayerCount = (delta: number) => {
        const currentIndex = SALEM_PLAYER_COUNTS.indexOf(settings.playerCount as typeof SALEM_PLAYER_COUNTS[number])
        const newIndex = Math.max(0, Math.min(SALEM_PLAYER_COUNTS.length - 1, currentIndex + delta))
        setSettings(s => ({ ...s, playerCount: SALEM_PLAYER_COUNTS[newIndex] }))
    }

    const updatePlayerName = (index: number, name: string) => {
        const newNames = [...settings.playerNames]
        newNames[index] = name
        setSettings(s => ({ ...s, playerNames: newNames }))
    }

    return (
        <div className="container mx-auto max-w-lg p-4 space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                    <ChevronLeft />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Flame className="h-6 w-6 text-orange-500" />
                        Salem 1692
                    </h1>
                    <p className="text-sm text-muted-foreground">การล่าแม่มดแห่งเซเลม</p>
                </div>
            </div>

            {/* Player Count */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        จำนวนผู้เล่น
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => adjustPlayerCount(-1)}
                            disabled={settings.playerCount <= 4}
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                        <div className="text-center min-w-[80px]">
                            <div className="text-4xl font-bold">{settings.playerCount}</div>
                            <div className="text-sm text-muted-foreground">คน</div>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => adjustPlayerCount(1)}
                            disabled={settings.playerCount >= 12}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Tryal Card Table Preview */}
                    <div className="mt-4 p-3 bg-muted rounded-lg text-sm space-y-1">
                        <div className="flex justify-between">
                            <span>🧙‍♀️ การ์ดแม่มด:</span>
                            <span className="font-bold text-red-500">{counts.witch} ใบ</span>
                        </div>
                        <div className="flex justify-between">
                            <span>😇 การ์ดผู้บริสุทธิ์:</span>
                            <span className="font-bold">{counts.notWitch} ใบ</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 mt-1">
                            <span>📦 รวม:</span>
                            <span className="font-bold">{counts.total} ใบ</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Player Names */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">ชื่อผู้เล่น (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                        {settings.playerNames.map((name, i) => (
                            <Input
                                key={i}
                                value={name}
                                onChange={(e) => updatePlayerName(i, e.target.value)}
                                placeholder={`ผู้เล่น ${i + 1}`}
                                className="text-sm"
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Role Toggles */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">ตัวละครเสริม</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="flex items-center gap-2">
                                👮 Constable (ผู้คุม)
                            </Label>
                            <p className="text-xs text-muted-foreground">มอบ Gavel Token เพื่อปกป้องผู้เล่นในกลางคืน</p>
                        </div>
                        <Switch
                            checked={settings.hasConstable}
                            onCheckedChange={(checked) => setSettings(s => ({ ...s, hasConstable: checked }))}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="flex items-center gap-2">
                                ⛪ Confessor (บาทหลวง)
                            </Label>
                            <p className="text-xs text-muted-foreground">ตรวจสอบ Tryal Card ของผู้เล่นได้ 1 ใบ</p>
                        </div>
                        <Switch
                            checked={settings.hasConfessor}
                            onCheckedChange={(checked) => setSettings(s => ({ ...s, hasConfessor: checked }))}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Options */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">ตัวเลือกเพิ่มเติม</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>โหมดผู้เริ่มต้น</Label>
                            <p className="text-xs text-muted-foreground">แสดงคำอธิบายเพิ่มเติม</p>
                        </div>
                        <Switch
                            checked={settings.beginnerMode}
                            onCheckedChange={(checked) => setSettings(s => ({ ...s, beginnerMode: checked }))}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>บันทึกโน้ต</Label>
                            <p className="text-xs text-muted-foreground">เปิดใช้งานการจดบันทึก</p>
                        </div>
                        <Switch
                            checked={settings.notesEnabled}
                            onCheckedChange={(checked) => setSettings(s => ({ ...s, notesEnabled: checked }))}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Start Button */}
            <Button
                className="w-full h-14 text-lg rounded-full shadow-lg"
                onClick={handleStart}
            >
                <Flame className="mr-2 h-5 w-5" />
                {SalemStrings.UI.START_GAME}
            </Button>
        </div>
    )
}
