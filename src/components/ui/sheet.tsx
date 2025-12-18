import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const SheetContext = React.createContext<{
    open: boolean
    setOpen: (open: boolean) => void
} | null>(null)

export const Sheet = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false)
    return (
        <SheetContext.Provider value={{ open, setOpen }}>
            {children}
        </SheetContext.Provider>
    )
}

export const SheetTrigger = ({ asChild, children }: { asChild?: boolean, children: React.ReactNode }) => {
    const context = React.useContext(SheetContext)
    if (!context) throw new Error("SheetTrigger must be used within Sheet")

    // Simple handling for now - if asChild we just clone, else wrap
    // For this specific app usage (Button as child), we can just wrap or attach event
    return (
        <div onClick={() => context.setOpen(true)} className="cursor-pointer">
            {children}
        </div>
    )
}

export const SheetContent = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const context = React.useContext(SheetContext)
    if (!context) throw new Error("SheetContent must be used within Sheet")

    return (
        <AnimatePresence>
            {context.open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-50"
                        onClick={() => context.setOpen(false)}
                    />

                    {/* Slide-in Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className={cn(
                            "fixed inset-y-0 right-0 z-50 h-full w-3/4 gap-4 border-l bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
                            className
                        )}
                    >
                        <div className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                            <X className="h-4 w-4 cursor-pointer" onClick={() => context.setOpen(false)} />
                            <span className="sr-only">Close</span>
                        </div>
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
