import { Navigate, Outlet } from "react-router-dom"
import { useAppStore } from "@/state/store"

export function RouteGuard() {
    const activeSessionId = useAppStore(state => state.activeSessionId)

    if (!activeSessionId) {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}
