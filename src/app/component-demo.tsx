import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RollingLyricView } from "@/components/rolling-lyric-view"
import { NotesSheet } from "@/components/notes-sheet"
import { CountdownTimer } from "@/components/countdown-timer"
import { CheckpointStep } from "@/components/checkpoint-step"
import type { Step, Checkpoint } from "@/lib/types"
import { ChevronLeft, Check, NotebookPen, Play } from "lucide-react"

// Demo steps for RollingLyricView
const DEMO_STEPS: (Step & { phaseIndex: number; stepIndex: number; turnLabel: string })[] = [
    { id: "1", kind: "INSTRUCTION", text_th: "ยินดีต้อนรับสู่ Component Demo", can_skip: false, phaseIndex: 0, stepIndex: 0, turnLabel: "เตรียมพร้อม" },
    { id: "2", kind: "INSTRUCTION", text_th: "นี่คือ RollingLyricView", helper_th: "แสดงขั้นตอนแบบ karaoke-style", can_skip: false, phaseIndex: 0, stepIndex: 1, turnLabel: "เตรียมพร้อม" },
    { id: "3", kind: "INSTRUCTION", text_th: "คลิกที่ขั้นตอนเพื่อเลือก", can_skip: true, phaseIndex: 0, stepIndex: 2, turnLabel: "เตรียมพร้อม" },
    { id: "4", kind: "INSTRUCTION", text_th: "ขั้นตอนนี้มี Timer", timerSeconds: 30, can_skip: true, phaseIndex: 0, stepIndex: 3, turnLabel: "ทดสอบ" },
    { id: "5", kind: "CHECKPOINT", text_th: "Checkpoint Demo", can_skip: true, phaseIndex: 0, stepIndex: 4, turnLabel: "ทดสอบ" },
    { id: "6", kind: "INSTRUCTION", text_th: "ขั้นตอนสุดท้าย", can_skip: false, phaseIndex: 0, stepIndex: 5, turnLabel: "จบ" },
]

export function ComponentDemoPage() {
    const navigate = useNavigate()
    const [activeIndex, setActiveIndex] = useState(0)
    const [notesOpen, setNotesOpen] = useState(false)
    const [showRollingView, setShowRollingView] = useState(false)

    const handleStepClick = (index: number) => {
        if (index === activeIndex) {
            setActiveIndex(Math.min(DEMO_STEPS.length - 1, activeIndex + 1))
        } else {
            setActiveIndex(index)
        }
    }

    const handleCheckpointSave = (cp: Checkpoint) => {
        console.log("Checkpoint saved:", cp)
        setActiveIndex(Math.min(DEMO_STEPS.length - 1, activeIndex + 1))
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
                <div className="flex items-center gap-4 max-w-4xl mx-auto">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                        <ChevronLeft />
                    </Button>
                    <h1 className="text-xl font-bold">Component Demo</h1>
                </div>
            </div>

            {/* Full-screen RollingLyricView Demo */}
            {showRollingView ? (
                <div className="h-screen w-full flex flex-col bg-background fixed inset-0 z-50">
                    <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur z-10">
                        <Button variant="ghost" size="icon" onClick={() => setShowRollingView(false)}>
                            <ChevronLeft />
                        </Button>
                        <div className="text-center">
                            <h2 className="font-bold text-sm">RollingLyricView Demo</h2>
                            <p className="text-xs text-muted-foreground">Step {activeIndex + 1}/{DEMO_STEPS.length}</p>
                        </div>
                        <div className="w-10" />
                    </header>

                    <RollingLyricView
                        steps={DEMO_STEPS}
                        activeIndex={activeIndex}
                        onStepClick={handleStepClick}
                        onCheckpointSave={handleCheckpointSave}
                        onCheckpointSkip={() => setActiveIndex(Math.min(DEMO_STEPS.length - 1, activeIndex + 1))}
                    />

                    {/* Footer - Standard Layout */}
                    <div className="p-4 pb-8 border-t bg-background/95 backdrop-blur z-10 flex gap-4 items-center justify-between">
                        <Button variant="outline" size="icon" onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))} className="h-14 w-14 rounded-full">
                            <ChevronLeft />
                        </Button>
                        <div className="flex-1 flex gap-2 justify-center">
                            <Button
                                className="h-14 flex-1 rounded-full text-lg shadow-lg"
                                onClick={() => setActiveIndex(Math.min(DEMO_STEPS.length - 1, activeIndex + 1))}
                            >
                                <Check className="mr-2 h-6 w-6" />
                                ทำเสร็จแล้ว
                            </Button>
                        </div>
                        <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full" onClick={() => setNotesOpen(true)}>
                            <NotebookPen className="h-5 w-5" />
                        </Button>
                    </div>

                    {notesOpen && (
                        <NotesSheet
                            onClose={() => setNotesOpen(false)}
                            currentCtx={{ phaseId: "demo", stepId: DEMO_STEPS[activeIndex].id, turnLabel: "Demo" }}
                        />
                    )}
                </div>
            ) : (
                /* Component Cards */
                <div className="max-w-4xl mx-auto p-4 space-y-6">

                    {/* RollingLyricView */}
                    <Card>
                        <CardHeader>
                            <CardTitle>RollingLyricView</CardTitle>
                            <CardDescription>Main gameplay UI - karaoke-style step display</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => setShowRollingView(true)} className="gap-2">
                                <Play className="h-4 w-4" />
                                Open Full Demo
                            </Button>
                            <div className="mt-4 text-sm text-muted-foreground space-y-1">
                                <p>• Auto-scrolls to active step</p>
                                <p>• Shows timer when step has <code>timerSeconds</code></p>
                                <p>• Shows helper text on active step</p>
                                <p>• Renders CheckpointStep for CHECKPOINT kind</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CountdownTimer */}
                    <Card>
                        <CardHeader>
                            <CardTitle>CountdownTimer</CardTitle>
                            <CardDescription>Timer with play/pause/reset controls</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CountdownTimer initialSeconds={60} />
                        </CardContent>
                    </Card>

                    {/* CheckpointStep */}
                    <Card>
                        <CardHeader>
                            <CardTitle>CheckpointStep</CardTitle>
                            <CardDescription>Save feelings/rating during gameplay</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CheckpointStep
                                stepId="demo"
                                phaseId="demo"
                                turnLabel="Demo Turn"
                                onSave={(cp) => console.log("Saved:", cp)}
                                onSkip={() => console.log("Skipped")}
                            />
                        </CardContent>
                    </Card>

                    {/* NotesSheet */}
                    <Card>
                        <CardHeader>
                            <CardTitle>NotesSheet</CardTitle>
                            <CardDescription>Bottom sheet for adding notes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => setNotesOpen(true)} variant="secondary" className="gap-2">
                                <NotebookPen className="h-4 w-4" />
                                Open Notes Sheet
                            </Button>
                        </CardContent>
                    </Card>

                    {/* UI Components */}
                    <Card>
                        <CardHeader>
                            <CardTitle>shadcn/ui Components</CardTitle>
                            <CardDescription>Base UI components from shadcn</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2 flex-wrap">
                                <Button>Default</Button>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="outline">Outline</Button>
                                <Button variant="ghost">Ghost</Button>
                                <Button variant="destructive">Destructive</Button>
                            </div>
                            <div className="space-y-2">
                                <Label>Input Example</Label>
                                <Input placeholder="Type something..." />
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch id="demo-switch" />
                                <Label htmlFor="demo-switch">Switch Example</Label>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            )}

            {/* Notes Sheet (outside fullscreen) */}
            {notesOpen && !showRollingView && (
                <NotesSheet
                    onClose={() => setNotesOpen(false)}
                    currentCtx={{ phaseId: "demo", stepId: "demo", turnLabel: "Demo" }}
                />
            )}
        </div>
    )
}
