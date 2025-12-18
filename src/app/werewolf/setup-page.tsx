import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { werewolfSettingsSchema, type WerewolfSettings } from "@/games/werewolf/schema"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ChevronLeft } from "lucide-react"

const defaultSettings: WerewolfSettings = {
    numberOfPlayers: 5,
    preset: "classic",
    roles: {
        wolves: 1,
        villagers: 2,
        seer: 1,
        witch: 0,
        guard: 1
    },
    rules: {
        revealRoleOnDeath: true,
        lastWordsEnabled: true,
        discussionTimerEnabled: true,
        discussionMinutes: 3,
        witchCanSaveSelf: false,
        witchOneActionPerNight: true,
    },
    features: {
        notesEnabled: true,
        quickTagsEnabled: true,
        checkpointsEnabled: true,
        checkpointFrequency: "EVERY_TURN"
    }
}

export function WerewolfSetupPage() {
    const navigate = useNavigate()
    const createSession = useAppStore(state => state.createSession)
    const lastSettings = useAppStore(state => state.lastSettings.werewolf)

    const form = useForm<WerewolfSettings>({
        resolver: zodResolver(werewolfSettingsSchema) as any, // Cast to any to avoid complex TS version mismatch
        defaultValues: lastSettings?.numberOfPlayers ? lastSettings : defaultSettings,
        mode: "onChange"
    })

    // Watch values for validation UI
    const numberOfPlayers = useWatch({ control: form.control, name: "numberOfPlayers" })
    const roles = useWatch({ control: form.control, name: "roles" })

    // Calculate total roles
    const totalRoles = roles ? Object.values(roles).reduce((a, b) => a + (Number(b) || 0), 0) : 0
    const isValidSum = totalRoles === numberOfPlayers

    const handleStart = (data: WerewolfSettings) => {
        createSession("werewolf", data)
        navigate("/werewolf/play")
    }

    const applyPreset = (preset: WerewolfSettings["preset"]) => {
        form.setValue("preset", preset)
        const players = form.getValues("numberOfPlayers")
        let newRoles = { ...form.getValues("roles") }

        switch (preset) {
            case "classic":
                newRoles = { wolves: Math.floor(players / 3), seer: 1, villagers: players - Math.floor(players / 3) - 1, witch: 0, guard: 0 }
                break
            case "witch":
                newRoles = { wolves: Math.floor(players / 3), seer: 1, witch: 1, villagers: players - Math.floor(players / 3) - 2, guard: 0 }
                break
            case "guard":
                newRoles = { wolves: Math.floor(players / 3), seer: 1, witch: 1, guard: 1, villagers: players - Math.floor(players / 3) - 3 }
                break;
        }

        // Safety check for negatives
        if (newRoles.villagers < 0) newRoles.villagers = 0

        // Adjust roles to match sum exactly if auto-calc was off
        // Ideally prompts user, but for MVP simple logic:
        form.setValue("roles", newRoles)
    }

    return (
        <div className="container mx-auto max-w-lg p-4 space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-2xl font-bold">ตั้งค่าเกม Werewolf</h1>
            </div>

            <form onSubmit={form.handleSubmit(handleStart)} className="space-y-6">

                {/* PLAYER COUNT */}
                <Card>
                    <CardHeader>
                        <CardTitle>จำนวนผู้เล่น</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Button type="button" variant="outline" size="icon" onClick={() => form.setValue("numberOfPlayers", Math.max(5, (numberOfPlayers || 5) - 1))}>-</Button>
                            <Input
                                type="number"
                                {...form.register("numberOfPlayers", { valueAsNumber: true })}
                                className="text-center text-lg font-bold"
                            />
                            <Button type="button" variant="outline" size="icon" onClick={() => form.setValue("numberOfPlayers", Math.min(20, (numberOfPlayers || 5) + 1))}>+</Button>
                        </div>
                        {form.formState.errors.numberOfPlayers && (
                            <p className="text-red-500 text-sm mt-2">{form.formState.errors.numberOfPlayers.message}</p>
                        )}
                    </CardContent>
                </Card>

                {/* ROLES */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>บทบาท</CardTitle>
                            <div className={cn("text-sm font-bold", isValidSum ? "text-green-500" : "text-red-500")}>
                                {totalRoles} / {numberOfPlayers || 0}
                            </div>
                        </div>
                        <CardDescription>จัดสรรบทบาทให้ครบตามจำนวนผู้เล่น</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {["classic", "witch", "guard"].map((p) => (
                                <Button key={p} type="button" variant={form.watch("preset") === p ? "default" : "outline"} onClick={() => applyPreset(p as any)} className="capitalize">
                                    {p}
                                </Button>
                            ))}
                        </div>

                        {[
                            { id: "wolves", label: "หมาป่า (Werewolf)" },
                            { id: "seer", label: "ผู้ทำนาย (Seer)" },
                            { id: "witch", label: "แม่มด (Witch)" },
                            { id: "guard", label: "ผู้คุ้มกัน (Guard)" },
                            { id: "villagers", label: "ชาวบ้าน (Villager)" },
                        ].map((role) => (
                            <div key={role.id} className="flex items-center justify-between">
                                <Label>{role.label}</Label>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                                        const current = form.getValues(`roles.${role.id}` as any) ?? 0
                                        form.setValue(`roles.${role.id}` as any, Math.max(0, current - 1))
                                    }}>-</Button>
                                    <span className="w-8 text-center">{form.watch(`roles.${role.id}` as any) ?? 0}</span>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                                        const current = form.getValues(`roles.${role.id}` as any) ?? 0
                                        form.setValue(`roles.${role.id}` as any, current + 1)
                                    }}>+</Button>
                                </div>
                            </div>
                        ))}

                        {form.formState.errors.roles && (
                            <p className="text-red-500 text-sm bg-red-500/10 p-2 rounded">{form.formState.errors.roles.message || form.formState.errors.roles.root?.message}</p>
                        )}
                    </CardContent>
                </Card>

                {/* RULES */}
                <Card>
                    <CardHeader><CardTitle>กติกาพิเศษ</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="revealRoleOnDeath">เปิดเผยบทบาทเมื่อตาย</Label>
                            <Switch
                                id="revealRoleOnDeath"
                                checked={form.watch("rules.revealRoleOnDeath")}
                                onCheckedChange={(checked) => form.setValue("rules.revealRoleOnDeath", checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="discussionTimerEnabled">จับเวลาอภิปราย</Label>
                            <Switch
                                id="discussionTimerEnabled"
                                checked={form.watch("rules.discussionTimerEnabled")}
                                onCheckedChange={(checked) => form.setValue("rules.discussionTimerEnabled", checked)}
                            />
                        </div>
                        {form.watch("roles.witch") > 0 && (
                            <>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="witchCanSaveSelf">แม่มดช่วยตัวเองได้</Label>
                                    <Switch
                                        id="witchCanSaveSelf"
                                        checked={form.watch("rules.witchCanSaveSelf")}
                                        onCheckedChange={(checked) => form.setValue("rules.witchCanSaveSelf", checked)}
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Button type="submit" size="lg" className="w-full text-lg h-14" disabled={!isValidSum}>
                    เริ่มดำเนินเกม
                </Button>
            </form>
        </div>
    )
}
