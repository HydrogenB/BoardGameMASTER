import { BrowserRouter, Routes, Route } from "react-router-dom"
import { LandingPage } from "@/app/landing-page"
import { ComponentDemoPage } from "@/app/component-demo"
import { WerewolfSetupPage } from "@/app/werewolf/setup-page"
import { WerewolfPlayPage } from "@/app/werewolf/play-page"
import { WerewolfSummaryPage } from "@/app/werewolf/summary-page"
import { CatanSetupPage } from "@/app/catan/setup-page"
import { CatanPlayPage } from "@/app/catan/play-page"
import { CatanSummaryPage } from "@/app/catan/summary-page"
import { TwoRoomsSetupPage } from "@/app/two-rooms/setup-page"
import { TwoRoomsPlayPage } from "@/app/two-rooms/play-page"
import { TwoRoomsSummaryPage } from "@/app/two-rooms/summary-page"
import { RouteGuard } from "@/components/route-guard"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/component-demo" element={<ComponentDemoPage />} />
        <Route path="/werewolf/setup" element={<WerewolfSetupPage />} />

        {/* Catan Routes */}
        <Route path="/catan/setup" element={<CatanSetupPage />} />
        <Route path="/catan/play" element={<CatanPlayPage />} />
        <Route path="/catan/summary" element={<CatanSummaryPage />} />

        {/* Two Rooms and a Boom Routes */}
        <Route path="/two-rooms/setup" element={<TwoRoomsSetupPage />} />
        <Route path="/two-rooms/play" element={<TwoRoomsPlayPage />} />
        <Route path="/two-rooms/summary" element={<TwoRoomsSummaryPage />} />

        {/* Protected Routes */}
        <Route element={<RouteGuard />}>
          <Route path="/werewolf/play" element={<WerewolfPlayPage />} />
          <Route path="/werewolf/summary" element={<WerewolfSummaryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
