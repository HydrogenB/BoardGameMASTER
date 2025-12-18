import { useState } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAppStore } from "@/state/store"
import type { Note } from "@/lib/types"

interface NotesSheetProps {
    onClose: () => void
    currentCtx: {
        phaseId: string
        stepId: string
        turnLabel: string
    }
}

export function NotesSheet({ onClose, currentCtx }: NotesSheetProps) {
    const addNote = useAppStore(state => state.addNote)
    const [text, setText] = useState("")
    const [playerLabel, setPlayerLabel] = useState("")
    const [tags, setTags] = useState("")

    const handleSave = () => {
        if (!text.trim()) return

        const note: Note = {
            id: crypto.randomUUID(),
            text: text,
            playerLabel: playerLabel || undefined,
            tags: tags.split(",").map(t => t.trim()).filter(Boolean),
            createdAt: new Date().toISOString(),
            phaseId: currentCtx.phaseId,
            stepId: currentCtx.stepId,
            turnLabel: currentCtx.turnLabel
        }

        addNote(note)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet */}
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-background rounded-t-xl p-6 shadow-2xl space-y-4"
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">บันทึกช่วยจำ</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
                </div>

                <div className="space-y-2">
                    <Label>ข้อความ</Label>
                    <Textarea
                        placeholder="พิมพ์สิ่งที่ต้องการบันทึก..."
                        value={text}
                        onChange={e => setText(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="space-y-2">
                    <Label>ผู้เล่นที่เกี่ยวข้อง (Optional)</Label>
                    <Input
                        placeholder="เช่น ผู้เล่น 1"
                        value={playerLabel}
                        onChange={e => setPlayerLabel(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Tags (คั่นด้วยน้ำหมายจุลภาค)</Label>
                    <Input
                        placeholder="suspicious, confirmed"
                        value={tags}
                        onChange={e => setTags(e.target.value)}
                    />
                </div>

                <Button className="w-full" onClick={handleSave}>บันทึกโน้ต</Button>
            </motion.div>
        </div>
    )
}
