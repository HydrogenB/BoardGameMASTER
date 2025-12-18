import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { twoRoomsSettingsSchema, GAME_PRESETS, type TwoRoomsSettings } from "@/games/two-rooms/schema"
import rolesData from "@/games/two-rooms/roles.json"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Users, Clock, Volume2, Layers, Check, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"

interface RoleData {
    role_id: string
    name: string
    name_th: string
    team: string
    icon_emoji: string
    script_intro: string
    is_core: boolean
    card_color_front: string
}

const roles = rolesData.roles as RoleData[]
const rolePresets = rolesData.presets as Record<string, {
    name: string
    name_th: string
    description_th: string
    roles: string[]
}>

const defaultSettings: TwoRoomsSettings = {
    playerCount: 10,
    config: GAME_PRESETS.standard_game,
    selectedRoles: ["president", "bomber", "blue_team", "red_team"],
    features: {
        soundEnabled: true,
        autoWarningAt60s: true,
        beginnerMode: true,
    },
}

export function TwoRoomsSetupPage() {
    const navigate = useNavigate()
    const createSession = useAppStore(state => state.createSession)
    const [selectedRolePreset, setSelectedRolePreset] = useState<string>("basic")

    const form = useForm<TwoRoomsSettings>({
        resolver: zodResolver(twoRoomsSettingsSchema) as any,
        defaultValues: defaultSettings,
        mode: "onChange"
    })

    const playerCount = form.watch("playerCount")
    const configId = form.watch("config.config_id")
    const selectedRoles = form.watch("selectedRoles")

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

    const applyRolePreset = (presetId: string) => {
        const preset = rolePresets[presetId]
        if (preset) {
            setSelectedRolePreset(presetId)
            form.setValue("selectedRoles", preset.roles)
        }
    }

    const toggleRole = (roleId: string) => {
        const current = form.getValues("selectedRoles")
        const role = roles.find(r => r.role_id === roleId)

        // Don't allow removing core roles
        if (role?.is_core && current.includes(roleId)) return

        if (current.includes(roleId)) {
            form.setValue("selectedRoles", current.filter(r => r !== roleId))
        } else {
            form.setValue("selectedRoles", [...current, roleId])
        }
        setSelectedRolePreset("") // Clear preset when manually selecting
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        return `${mins} นาที`
    }

    const currentConfig = form.watch("config")

    // Count teams
    const teamCounts = selectedRoles.reduce((acc, roleId) => {
        const role = roles.find(r => r.role_id === roleId)
        if (role) {
            acc[role.team] = (acc[role.team] || 0) + 1
        }
        return acc
    }, {} as Record<string, number>)

    const getTeamColor = (team: string) => {
        switch (team) {
            case "BLUE": return "bg-blue-500"
            case "RED": return "bg-red-500"
            case "GREY": return "bg-gray-500"
            case "GREEN": return "bg-green-500"
            default: return "bg-muted"
        }
    }

    return (
        <div className="container mx-auto max-w-lg p-4 space-y-6 pb-24">
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
                        <div className="flex items-center gap-4 justify-center">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-12 w-12"
                                onClick={() => form.setValue("playerCount", Math.max(6, (playerCount || 10) - 1))}
                            >
                                -
                            </Button>
                            <Input
                                type="number"
                                {...form.register("playerCount", { valueAsNumber: true })}
                                className="text-center text-3xl font-bold w-24 h-16"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-12 w-12"
                                onClick={() => form.setValue("playerCount", Math.min(30, (playerCount || 10) + 1))}
                            >
                                +
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-3 text-center">
                            🚪 ห้องละ ~{Math.ceil(playerCount / 2)} คน
                        </p>
                        {form.formState.errors.playerCount && (
                            <p className="text-red-500 text-sm mt-2">{form.formState.errors.playerCount.message}</p>
                        )}
                    </CardContent>
                </Card>

                {/* ROLE SELECTION */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Layers className="w-5 h-5" />
                            บทบาทในเกม
                        </CardTitle>
                        <CardDescription>เลือกชุดบทบาทหรือกำหนดเอง</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Role Presets */}
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(rolePresets).map(([id, preset]) => (
                                <Button
                                    key={id}
                                    type="button"
                                    variant={selectedRolePreset === id ? "default" : "outline"}
                                    onClick={() => applyRolePreset(id)}
                                    className="flex flex-col h-auto py-3"
                                >
                                    <span className="font-bold">{preset.name_th}</span>
                                    <span className="text-xs opacity-70">{preset.roles.length} บทบาท</span>
                                </Button>
                            ))}
                        </div>

                        {/* Team Balance */}
                        <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-sm font-medium mb-2">สมดุลทีม:</p>
                            <div className="flex gap-2 flex-wrap">
                                {teamCounts.BLUE && (
                                    <Badge className="bg-blue-500">🔵 {teamCounts.BLUE}</Badge>
                                )}
                                {teamCounts.RED && (
                                    <Badge className="bg-red-500">🔴 {teamCounts.RED}</Badge>
                                )}
                                {teamCounts.GREY && (
                                    <Badge className="bg-gray-500">⚫ {teamCounts.GREY}</Badge>
                                )}
                            </div>
                        </div>

                        {/* Role Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            {roles.map(role => {
                                const isSelected = selectedRoles.includes(role.role_id)
                                return (
                                    <Button
                                        key={role.role_id}
                                        type="button"
                                        variant="outline"
                                        onClick={() => toggleRole(role.role_id)}
                                        className={cn(
                                            "h-auto py-3 px-3 justify-start relative",
                                            isSelected && "border-2 border-primary bg-primary/5",
                                            role.is_core && "opacity-80"
                                        )}
                                        disabled={role.is_core}
                                    >
                                        <div className={cn(
                                            "w-2 h-full absolute left-0 top-0 rounded-l",
                                            getTeamColor(role.team)
                                        )} />
                                        <div className="flex items-center gap-2 ml-2">
                                            <span className="text-xl">{role.icon_emoji}</span>
                                            <div className="text-left">
                                                <div className="font-medium text-sm">{role.name_th}</div>
                                                <div className="text-xs text-muted-foreground">{role.name}</div>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <Check className="w-4 h-4 ml-auto text-primary" />
                                        )}
                                        {role.is_core && (
                                            <Badge variant="secondary" className="ml-auto text-xs">จำเป็น</Badge>
                                        )}
                                    </Button>
                                )
                            })}
                        </div>
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

                {/* GM MODE & FEATURES */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5" />
                            โหมด Game Master
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Beginner Mode Toggle */}
                        <div className={cn(
                            "rounded-lg p-4 transition-all",
                            form.watch("features.beginnerMode")
                                ? "bg-green-500/10 border border-green-500/30"
                                : "bg-muted/50"
                        )}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-xl",
                                        form.watch("features.beginnerMode")
                                            ? "bg-green-500/20"
                                            : "bg-muted"
                                    )}>
                                        {form.watch("features.beginnerMode") ? "🌱" : "⚡"}
                                    </div>
                                    <div>
                                        <Label htmlFor="beginnerMode" className="font-medium">
                                            {form.watch("features.beginnerMode")
                                                ? "โหมดมือใหม่"
                                                : "โหมดผู้เชี่ยวชาญ"
                                            }
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            {form.watch("features.beginnerMode")
                                                ? "แสดงคำแนะนำละเอียดทุกขั้นตอน"
                                                : "แสดงเฉพาะข้อมูลจำเป็น"
                                            }
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    id="beginnerMode"
                                    checked={form.watch("features.beginnerMode")}
                                    onCheckedChange={(checked) => form.setValue("features.beginnerMode", checked)}
                                />
                            </div>
                        </div>

                        <div className="border-t pt-4 space-y-4">
                            <p className="text-sm font-medium text-muted-foreground">ตัวเลือกเสียง</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                                    <Label htmlFor="soundEnabled">เปิดเสียงเอฟเฟกต์</Label>
                                </div>
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
                        </div>
                    </CardContent>
                </Card>

                {/* START BUTTON - Fixed at bottom */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t">
                    <div className="container max-w-lg mx-auto">
                        <Button type="submit" size="lg" className="w-full text-lg h-14">
                            🎮 เริ่มเกม!
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
