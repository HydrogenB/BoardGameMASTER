import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { twoRoomsSettingsSchema, GAME_PRESETS, type TwoRoomsSettings } from "@/games/two-rooms/schema"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Users, Clock, Volume2 } from "lucide-react"

const defaultSettings: TwoRoomsSettings = {
    playerCount: 10,
    config: GAME_PRESETS.standard_game,
    selectedRoles: ["president", "bomber"],
    features: {
        soundEnabled: true,
        autoWarningAt60s: true,
    },
}

export function TwoRoomsSetupPage() {
    const navigate = useNavigate()
    const createSession = useAppStore(state => state.createSession)

    const form = useForm<TwoRoomsSettings>({
        resolver: zodResolver(twoRoomsSettingsSchema) as any,
        defaultValues: defaultSettings,
        mode: "onChange"
    })

    const playerCount = form.watch("playerCount")
    const configId = form.watch("config.config_id")

    const handleStart = (data: TwoRoomsSettings) => {
        createSession("two-rooms", data)
        navigate("/two-rooms/play")
    }

    const applyPreset = (presetId: string) => {
        const preset = GAME_PRESETS[presetId]
        if (preset) {
            form.setValue("config", preset)
        }
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        return `${mins} นาที`
    }

    const currentConfig = form.watch("config")

    return (
        <div className="container mx-auto max-w-lg p-4 space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-2xl font-bold">Two Rooms and a Boom</h1>
            </div>

            <form onSubmit={form.handleSubmit(handleStart)} className="space-y-6">

                {/* PLAYER COUNT */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            จำนวนผู้เล่น
                        </CardTitle>
                        <CardDescription>รองรับ 6-30 คน</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => form.setValue("playerCount", Math.max(6, (playerCount || 10) - 1))}
                            >
                                -
                            </Button>
                            <Input
                                type="number"
                                {...form.register("playerCount", { valueAsNumber: true })}
                                className="text-center text-2xl font-bold w-20"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => form.setValue("playerCount", Math.min(30, (playerCount || 10) + 1))}
                            >
                                +
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                            ห้องละ ~{Math.ceil(playerCount / 2)} คน
                        </p>
                        {form.formState.errors.playerCount && (
                            <p className="text-red-500 text-sm mt-2">{form.formState.errors.playerCount.message}</p>
                        )}
                    </CardContent>
                </Card>

                {/* GAME PRESET */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            รูปแบบเกม
                        </CardTitle>
                        <CardDescription>เลือกความยาวและจำนวนรอบ</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(GAME_PRESETS).map(([id, preset]) => (
                                <Button
                                    key={id}
                                    type="button"
                                    variant={configId === id ? "default" : "outline"}
                                    onClick={() => applyPreset(id)}
                                    className="flex flex-col h-auto py-3"
                                >
                                    <span className="font-bold">
                                        {id === "standard_game" ? "มาตรฐาน" :
                                            id === "quick_game" ? "เร็ว" : "ปาร์ตี้"}
                                    </span>
                                    <span className="text-xs opacity-70">
                                        {preset.rounds.length} รอบ
                                    </span>
                                </Button>
                            ))}
                        </div>

                        {/* Round breakdown */}
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                            <p className="text-sm font-medium">รายละเอียดรอบ:</p>
                            {currentConfig.rounds.map((round, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span>
                                        {idx === currentConfig.rounds.length - 1 ? "🚨 " : ""}
                                        รอบที่ {round.round_idx}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {formatDuration(round.duration_sec)}
                                        {round.hostages_to_swap > 0
                                            ? ` • แลก ${round.hostages_to_swap} คน`
                                            : " • Final!"
                                        }
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* FEATURES */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Volume2 className="w-5 h-5" />
                            ตัวเลือกเสียง
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="soundEnabled">เปิดเสียงเอฟเฟกต์</Label>
                            <Switch
                                id="soundEnabled"
                                checked={form.watch("features.soundEnabled")}
                                onCheckedChange={(checked) => form.setValue("features.soundEnabled", checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="autoWarning">เตือนอัตโนมัติ 1 นาทีสุดท้าย</Label>
                                <p className="text-xs text-muted-foreground">เสียงไซเรนเตือนก่อนหมดเวลา</p>
                            </div>
                            <Switch
                                id="autoWarning"
                                checked={form.watch("features.autoWarningAt60s")}
                                onCheckedChange={(checked) => form.setValue("features.autoWarningAt60s", checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" size="lg" className="w-full text-lg h-14">
                    🎮 เริ่มเกม!
                </Button>
            </form>
        </div>
    )
}
