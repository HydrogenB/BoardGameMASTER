import { BrowserRouter, Routes, Route } from "react-router-dom"
import { LandingPage } from "@/app/landing-page"
import { WerewolfSetupPage } from "@/app/werewolf/setup-page"
import { WerewolfPlayPage } from "@/app/werewolf/play-page"
import { WerewolfSummaryPage } from "@/app/werewolf/summary-page"
import { CatanSetupPage } from "@/app/catan/setup-page"
import { CatanPlayPage } from "@/app/catan/play-page"
import { CatanSummaryPage } from "@/app/catan/summary-page"
import { RouteGuard } from "@/components/route-guard"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/werewolf/setup" element={<WerewolfSetupPage />} />

        {/* Catan Routes */}
        <Route path="/catan/setup" element={<CatanSetupPage />} />
        <Route path="/catan/play" element={<CatanPlayPage />} />
        <Route path="/catan/summary" element={<CatanSummaryPage />} />

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

