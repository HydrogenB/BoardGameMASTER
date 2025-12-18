import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { Step, Checkpoint } from "@/lib/types"
import { CheckpointStep } from "@/components/checkpoint-step"

export interface ExtendedStep extends Step {
    phaseIndex: number
    stepIndex: number
    turnLabel?: string
}

interface RollingLyricViewProps {
    steps: ExtendedStep[]
    activeIndex: number
    onStepClick: (index: number) => void
    onCheckpointSave?: (checkpoint: Checkpoint) => void
    onCheckpointSkip?: () => void
}

export function RollingLyricView({
    steps,
    activeIndex,
    onStepClick,
    onCheckpointSave,
    onCheckpointSkip
}: RollingLyricViewProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<(HTMLDivElement | null)[]>([])

    useEffect(() => {
        const activeItem = itemRefs.current[activeIndex]
        if (activeItem) {
            activeItem.scrollIntoView({
                behavior: "smooth",
                block: "center",
            })
        }
    }, [activeIndex])

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto w-full py-[40vh] scroll-smooth no-scrollbar"
        >
            <div className="flex flex-col items-center gap-6 px-4">
                {steps.map((step, index) => {
                    const isActive = index === activeIndex
                    const distance = Math.abs(index - activeIndex)

                    // Checkpoint special render
                    if (step.kind === "CHECKPOINT" && isActive) {
                        return (
                            <motion.div
                                key={step.id}
                                ref={(el: HTMLDivElement | null) => { itemRefs.current[index] = el }}
                                className="w-full max-w-sm py-4"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <CheckpointStep
                                    stepId={step.id}
                                    phaseId={step.phaseIndex.toString()}
                                    turnLabel={step.turnLabel || ""}
                                    onSave={(cp) => onCheckpointSave?.(cp)}
                                    onSkip={() => onCheckpointSkip?.()}
                                />
                            </motion.div>
                        )
                    }

                    const opacity = distance === 0 ? 1 : Math.max(0.1, 0.7 - distance * 0.2)
                    const scale = distance === 0 ? 1.05 : Math.max(0.9, 1 - distance * 0.05)
                    const fontWeight = isActive ? 700 : 400

                    return (
                        <motion.div
                            key={step.id}
                            ref={(el: HTMLDivElement | null) => { itemRefs.current[index] = el }}
                            className={cn(
                                "w-full text-center transition-all duration-300 cursor-pointer select-none py-4",
                                isActive ? "text-primary text-3xl md:text-4xl" : "text-muted-foreground text-xl"
                            )}
                            style={{ fontWeight }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{
                                opacity,
                                scale,
                                filter: isActive ? "blur(0px)" : `blur(${distance}px)`
                            }}
                            onClick={() => onStepClick(index)}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div>{step.text_th}</div>
                            {step.helper_th && isActive && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="text-base font-normal mt-2 text-primary/80"
                                >
                                    {step.helper_th}
                                </motion.div>
                            )}
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
