import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { MissionControlPage } from "@/pages/MissionControlPage";
import { NavigatorPage } from "@/pages/NavigatorPage";
import { PlannerPage } from "@/pages/PlannerPage";
import { LaboratoryPage } from "@/pages/LaboratoryPage";
import { LaunchVehiclePage } from "@/pages/LaunchVehiclePage";
import { OrbitalPlanningPage } from "@/pages/OrbitalPlanningPage";
import { SimulationPage } from "@/pages/SimulationPage";
import { TelemetryPage } from "@/pages/TelemetryPage";
import { RocketGamePage } from '@/pages/RocketGamePage';
import { EvaluationPage } from '@/pages/EvaluationPage';


/**
 * Application routes.
 *
 * Hash routing keeps the build deployable to any static host — GitHub
 * Pages, S3, Netlify — without server-side rewrite rules.
 */
export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<MissionControlPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/laboratory" element={<LaboratoryPage />} />
        <Route path="/launch" element={<LaunchVehiclePage />} />
        <Route path="/trajectory" element={<OrbitalPlanningPage />} />
        <Route path="/navigator" element={<NavigatorPage />} />
        <Route path="/simulation" element={<SimulationPage />} />
        <Route path="/telemetry" element={<TelemetryPage />} />
        <Route path="/evaluation" element={<EvaluationPage />} />
        <Route path="/game" element={<RocketGamePage />} />
      </Routes>
    </AppShell>
  );
}
