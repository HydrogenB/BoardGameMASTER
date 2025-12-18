import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface CountdownTimerProps {
    initialSeconds: number
    autoStart?: boolean
    onFinish?: () => void
}

export function CountdownTimer({ initialSeconds, autoStart = false, onFinish }: CountdownTimerProps) {
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
    const [isActive, setIsActive] = useState(autoStart)
    const [isFinished, setIsFinished] = useState(false)

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>

        if (isActive && secondsLeft > 0) {
            interval = setInterval(() => {
                setSecondsLeft((prev) => {
                    const next = prev - 1
                    if (next <= 0) {
                        setIsFinished(true)
                        setIsActive(false)
                        onFinish?.()
                        return 0
                    }
                    return next
                })
            }, 1000)
        }

        return () => clearInterval(interval)
    }, [isActive, secondsLeft, onFinish])

    const toggleTimer = () => {
        if (isFinished) return
        setIsActive(!isActive)
    }

    const resetTimer = () => {
        setIsActive(false)
        setIsFinished(false)
        setSecondsLeft(initialSeconds)
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, "0")}`
    }

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <div className="relative w-full max-w-[200px] aspect-sqaure flex items-center justify-center py-6">
                {/* Progress Ring Visualization could go here, keeping it simple for now */}
                <div className={cn(
                    "text-6xl font-mono font-bold tabular-nums transition-colors",
                    secondsLeft <= 10 && "text-red-500 animate-pulse",
                    isFinished && "text-muted-foreground"
                )}>
                    {formatTime(secondsLeft)}
                </div>
            </div>

            <div className="flex gap-4">
                <Button
                    variant={isActive ? "secondary" : "default"}
                    size="lg"
                    className="w-32 rounded-full"
                    onClick={toggleTimer}
                    disabled={isFinished && secondsLeft === 0}
                >
                    {isActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                    {isActive ? "หยุด" : "เริ่ม"}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={resetTimer}
                >
                    <RotateCcw className="h-5 w-5" />
                </Button>
            </div>
        </div>
    )
}
