import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  BookOpen,
  Compass,
  Database,
  FlaskConical,
  Gauge,
  Orbit,
  Rocket,
  Settings2,
  Telescope,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCurrentMission } from "@/store/missionStore";
import { useSimulationStore } from "@/store/simulationStore";
import { useSettingsStore } from "@/store/settingsStore";
import { StatusDot } from "@/components/ui/Metric";
import { IconButton } from "@/components/ui/Button";
import PatternWaves from '@/components/ui/PatternWaves';
import { DataSourcesModal } from "@/components/DataSourcesModal";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { sound } from "@/utils/sound";

interface NavItem {
  to: string;
  label: string;
  short: string;
  icon: ReactNode;
  hint: string;
}

const NAV_SECTIONS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Mission Design",
    items: [
      { to: "/", label: "Mission Control", short: "Control", icon: <Gauge size={14} />, hint: "Dashboard" },
      { to: "/planner", label: "Mission Planner", short: "Planner", icon: <FlaskConical size={14} />, hint: "Define the mission" },
      { to: "/laboratory", label: "Spacecraft Laboratory", short: "Lab", icon: <Telescope size={14} />, hint: "Build the spacecraft" },
      { to: "/launch", label: "Launch Vehicles", short: "Launch", icon: <Rocket size={14} />, hint: "Choose a launcher" },
      { to: "/trajectory", label: "Orbital Planning", short: "Trajectory", icon: <Orbit size={14} />, hint: "Plan the transfer" },
    ],
  },
  {
    title: "Flight Operations",
    items: [
      { to: "/navigator", label: "Solar System", short: "System", icon: <Compass size={14} />, hint: "Explore the system" },
      { to: "/simulation", label: "Mission Simulation", short: "Sim", icon: <Activity size={14} />, hint: "Fly the mission" },
      { to: "/telemetry", label: "Mission Telemetry", short: "Telemetry", icon: <Activity size={14} />, hint: "Live flight data" },
      { to: "/evaluation", label: "Mission Evaluation", short: "Report", icon: <BookOpen size={14} />, hint: "Score the mission" },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const mission = useCurrentMission();
  const running = useSimulationStore((state) => state.running);
  const runtime = useSimulationStore((state) => state.runtime);
  const settings = useSettingsStore();
  const location = useLocation();

  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(settings.soundEnabled);
  const [utcTime, setUtcTime] = useState("");

  // Keep sound controller in sync with state
  useEffect(() => {
    sound.enabled = settings.soundEnabled;
    setSoundActive(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Live real-time mission clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = !soundActive;
    // Use the store's toggleSound action instead of a non‑existent update method
    settings.toggleSound();
    sound.enabled = next;
    setSoundActive(next);
    if (next) sound.telemetryChirp();
  };

  const phaseLabel = runtime?.phase ?? null;

  return (
    <div className="relative flex min-h-screen flex-col bg-black text-white selection:bg-white selection:text-black">
      {/* 21st.dev Background Coordinate Grid */}
      <PatternWaves
    preset="silk"
    color="#ffffff"
    backgroundColor="#111111"
    fade="edges"
    interactive
    cursorSize={50}
    cursorStrength={0.6}
    opacity={0.8}
    style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
  />

      {/* ------------------------------------------------------------ header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center border border-white bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.25)]">
                <Orbit size={18} strokeWidth={2.2} />
              </div>
              <div className="leading-none">
                <div className="text-[13px] font-black tracking-[0.2em] uppercase font-mono text-white">
                  MISSIONFORGE
                </div>
                <div className="label-tech mt-1 text-[8.5px] text-neutral-400">
                  DEEP SPACE MISSION ARCHITECT
                </div>
              </div>
            </div>

            {/* Live Clock Ticker */}
            <div className="hidden border-l border-white/10 pl-4 font-mono text-[11px] text-neutral-400 xl:block">
              <span className="text-white/40">TIME · </span>
              <span className="text-white tabular-nums">{utcTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Mission Badge */}
            <div className="hidden items-center gap-3 border-l border-white/10 pl-4 sm:flex">
              <div className="text-right leading-tight">
                <div className="label-tech text-[8.5px] text-neutral-400">TARGET STATUS</div>
                <div className="max-w-[180px] truncate font-mono text-[12px] font-bold text-white">
                  {mission ? mission.name : "NO FLIGHT LOG"}
                </div>
              </div>
              {mission ? (
                <StatusDot
                  tone={running ? "success" : phaseLabel === "failed" ? "danger" : "accent"}
                  pulse={running}
                  label={running ? "ACTIVE" : mission.status.toUpperCase()}
                />
              ) : null}
            </div>

            {/* Audio Toggle */}
            <IconButton
              label={soundActive ? "Mute audio synthesis" : "Enable tactile audio synthesis"}
              icon={soundActive ? <Volume2 size={15} className="text-white" /> : <VolumeX size={15} />}
              onClick={toggleSound}
            />

            <IconButton
              label="Data sources and scientific references"
              icon={<Database size={15} />}
              onClick={() => setSourcesOpen(true)}
            />

            <IconButton
              label="Application settings"
              icon={<Settings2 size={15} />}
              onClick={() => setSettingsOpen(true)}
            />
          </div>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1">
        {/* ----------------------------------------------------------- sidebar */}
        <nav className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-white/10 bg-black px-3 py-4 lg:block">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-6">
              <div className="label-tech mb-2 px-2.5 text-[9px] font-semibold tracking-[0.2em] text-neutral-400">
                {section.title}
              </div>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) =>
                        `group flex items-center justify-between rounded-[2px] px-2.5 py-2 text-[12px] font-mono transition-all duration-150 ${
                          isActive
                            ? "border border-white bg-white text-black font-semibold shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                            : "border border-transparent text-neutral-400 hover:border-white/20 hover:bg-[#111111] hover:text-white"
                        }`
                      }
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <span className="shrink-0">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="mt-8 border-t border-white/10 px-2.5 pt-4 font-mono">
            <div className="label-tech mb-1 text-[8.5px] text-neutral-400">PITCH BLACK / HIGH CONTRAST</div>
            <p className="text-[10px] leading-relaxed text-neutral-400">
              Deterministic SI physics engine with no external CDN dependency.
            </p>
          </div>
        </nav>

        {/* ------------------------------------------------------------- main */}
        <main className="min-w-0 flex-1 bg-black">
          <div key={location.pathname} className="animate-fade-up">
            {children}
          </div>
        </main>
      </div>

      {/* ------------------------------------------------------- mobile nav */}
      <nav className="sticky bottom-0 z-40 flex overflow-x-auto border-t border-white/10 bg-black/95 backdrop-blur-md lg:hidden">
        {NAV_SECTIONS.flatMap((section) => section.items).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex min-w-[70px] flex-1 flex-col items-center gap-1 px-2 py-2.5 text-[10px] font-mono ${
                isActive ? "text-white font-bold border-t-2 border-white" : "text-neutral-500"
              }`
            }
          >
            {item.icon}
            <span>{item.short}</span>
          </NavLink>
        ))}
      </nav>

      <DataSourcesModal open={sourcesOpen} onClose={() => setSourcesOpen(false)} />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
