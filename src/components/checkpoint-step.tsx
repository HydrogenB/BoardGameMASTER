import { Button } from "@/components/ui/button"
import type { Checkpoint } from "@/lib/types"

interface CheckpointStepProps {
    stepId: string
    phaseId: string
    turnLabel: string
    onSave: (checkpoint: Checkpoint) => void
    onSkip: () => void
}

export function CheckpointStep({ phaseId, turnLabel, onSave, onSkip }: CheckpointStepProps) {

    const handleSave = () => {
        onSave({
            id: crypto.randomUUID(),
            rating: 5, // Default rating since we removed UI
            createdAt: new Date().toISOString(),
            phaseId,
            turnLabel
        })
    }

    return (
        <div className="flex flex-col items-center gap-4 bg-secondary/20 p-6 rounded-xl border border-primary/20">
            <h3 className="text-xl font-bold text-primary">ให้คะแนนช่วงนี้</h3>

            <div className="text-muted-foreground text-sm text-center">
                บันทึกความรู้สึกไว้ดูตอนจบเกม
            </div>

            <div className="flex gap-4 w-full mt-4">
                <Button variant="outline" className="flex-1" onClick={onSkip}>ข้าม</Button>
                <Button className="flex-1" onClick={handleSave}>บันทึก</Button>
            </div>
        </div>
    )
}
