import { useState, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAppStore } from "@/state/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Play, RotateCcw, Search, Users, Clock, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GameId } from "@/lib/types"

// ============ GAME REGISTRY ============
// Add new games here - the UI will automatically update
interface GameConfig {
    id: GameId
    name: string
    subtitle: string
    description: string
    icon: string
    playerRange: string
    duration: string
    category: "social" | "strategy" | "party" | "deduction"
    isNew?: boolean
    comingSoon?: boolean
    accent?: string  // Tailwind color class
}

const GAMES: GameConfig[] = [
    {
        id: "werewolf",
        name: "Werewolf",
        subtitle: "เกมจิตวิทยามนุษย์หมาป่า",
        description: "เกมปาร์ตี้บลัฟฟ์ยอดฮิต ใช้ไหวพริบ การเจรจา และจับโกหก",
        icon: "🐺",
        playerRange: "5-20",
        duration: "30-60 นาที",
        category: "deduction",
        accent: "amber"
    },
    {
        id: "catan",
        name: "Catan",
        subtitle: "นักบุกเบิกแห่ง Catan",
        description: "ผู้ช่วยทอยเต๋าและติดตามสถิติ หมดปัญหาลูกเต๋าหาย",
        icon: "🏝️",
        playerRange: "3-6",
        duration: "60-90 นาที",
        category: "strategy",
        accent: "orange"
    },
    {
        id: "two-rooms",
        name: "Two Rooms",
        subtitle: "Two Rooms and a Boom",
        description: "เกมปาร์ตี้แบ่ง 2 ห้อง จับเวลา แลกตัวประกัน",
        icon: "💣",
        playerRange: "6-30",
        duration: "15-30 นาที",
        category: "party",
        isNew: true,
        accent: "red"
    },
    // Future games - set comingSoon: true
    // {
    //     id: "avalon",
    //     name: "Avalon",
    //     subtitle: "The Resistance: Avalon",
    //     description: "เกมหาคนทรยศในหมู่อัศวิน",
    //     icon: "⚔️",
    //     playerRange: "5-10",
    //     duration: "30-45 นาที",
    //     category: "deduction",
    //     comingSoon: true
    // },
]

const CATEGORY_LABELS: Record<string, string> = {
    social: "Social",
    strategy: "กลยุทธ์",
    party: "ปาร์ตี้",
    deduction: "หาคนร้าย"
}

// ============ COMPONENT ============
export function LandingPage() {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    const activeSessionId = useAppStore(state => state.activeSessionId)
    const sessions = useAppStore(state => state.sessions)
    const activeSession = activeSessionId ? sessions[activeSessionId] : null

    // Filter games
    const filteredGames = useMemo(() => {
        return GAMES.filter(game => {
            const matchesSearch = !searchQuery ||
                game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                game.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = !selectedCategory || game.category === selectedCategory
            return matchesSearch && matchesCategory
        })
    }, [searchQuery, selectedCategory])

    const handleResume = () => {
        if (activeSession) {
            navigate(`/${activeSession.gameId}/play`)
        }
    }

    const categories = [...new Set(GAMES.map(g => g.category))]

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
                <div className="container mx-auto max-w-4xl p-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-primary">Board Game MASTER</h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">ผู้ช่วยดำเนินเกมบอร์ดเกม</p>
                        </div>
                        <Link to="/component-demo">
                            <Button variant="ghost" size="sm" className="text-muted-foreground">
                                <Sparkles className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-4xl p-4 space-y-6">
                {/* Resume Card */}
                {activeSession && activeSession.status === 'IN_PROGRESS' && (
                    <button
                        onClick={handleResume}
                        className="w-full p-4 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors text-left flex items-center gap-4"
                    >
                        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <RotateCcw className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold">เล่นต่อจากเดิม</p>
                            <p className="text-sm text-muted-foreground">
                                {GAMES.find(g => g.id === activeSession.gameId)?.name || activeSession.gameId} •
                                {new Date(activeSession.updatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                            </p>
                        </div>
                        <Play className="h-5 w-5 text-primary" />
                    </button>
                )}

                {/* Search & Filter */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="ค้นหาเกม..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        <Button
                            variant={selectedCategory === null ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(null)}
                            className="shrink-0"
                        >
                            ทั้งหมด
                        </Button>
                        {categories.map(cat => (
                            <Button
                                key={cat}
                                variant={selectedCategory === cat ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                                className="shrink-0"
                            >
                                {CATEGORY_LABELS[cat]}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Game Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredGames.map(game => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </div>

                {filteredGames.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>ไม่พบเกมที่ค้นหา</p>
                    </div>
                )}

                {/* Stats Footer */}
                <div className="text-center py-8 text-muted-foreground text-sm">
                    <p>{GAMES.filter(g => !g.comingSoon).length} เกมพร้อมเล่น</p>
                </div>
            </div>
        </div>
    )
}

// ============ GAME CARD COMPONENT ============
function GameCard({ game }: { game: GameConfig }) {
    if (game.comingSoon) {
        return (
            <div className="relative p-4 rounded-xl border border-dashed opacity-60 cursor-not-allowed">
                <div className="flex items-start gap-3">
                    <div className="text-3xl">{game.icon}</div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold truncate">{game.name}</h3>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">เร็วๆ นี้</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{game.subtitle}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Link to={`/${game.id}/setup`}>
            <div className={cn(
                "group relative p-4 rounded-xl border transition-all duration-200",
                "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
                game.isNew && "border-red-500/30"
            )}>
                {/* New Badge */}
                {game.isNew && (
                    <span className="absolute -top-2 -right-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">
                        NEW
                    </span>
                )}

                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                        "text-3xl h-12 w-12 rounded-lg flex items-center justify-center shrink-0",
                        "bg-muted group-hover:scale-110 transition-transform"
                    )}>
                        {game.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg leading-tight">{game.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{game.subtitle}</p>

                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {game.playerRange}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {game.duration}
                            </span>
                        </div>
                    </div>

                    {/* Play Arrow */}
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Play className="h-4 w-4" />
                    </div>
                </div>

                {/* Description on hover - hidden on mobile */}
                <p className="hidden sm:block mt-3 text-sm text-muted-foreground line-clamp-2 group-hover:text-foreground/80 transition-colors">
                    {game.description}
                </p>
            </div>
        </Link>
    )
}
