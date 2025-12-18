import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { Checkpoint } from "@/lib/types"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckpointStepProps {
    stepId: string
    phaseId: string
    turnLabel: string
    onSave: (checkpoint: Checkpoint) => void
    onSkip: () => void
}

export function CheckpointStep({ phaseId, turnLabel, onSave, onSkip }: CheckpointStepProps) {
    const [rating, setRating] = useState(0)

    const handleSave = () => {
        if (rating === 0) return
        onSave({
            id: crypto.randomUUID(),
            rating,
            createdAt: new Date().toISOString(),
            phaseId,
            turnLabel
        })
    }

    return (
        <div className="flex flex-col items-center gap-4 bg-secondary/20 p-6 rounded-xl border border-primary/20">
            <h3 className="text-xl font-bold text-primary">ให้คะแนนช่วงนี้</h3>

            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                    >
                        <Star
                            className={cn(
                                "w-10 h-10",
                                star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                            )}
                        />
                    </button>
                ))}
            </div>

            <div className="flex gap-4 w-full mt-4">
                <Button variant="outline" className="flex-1" onClick={onSkip}>ข้าม</Button>
                <Button className="flex-1" disabled={rating === 0} onClick={handleSave}>บันทึก</Button>
            </div>
        </div>
    )
}
