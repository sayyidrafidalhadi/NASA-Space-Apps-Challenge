import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CircleDot,
  Compass,
  Play,
  Plus,
  Rocket,
  Satellite,
  Target,
} from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { DataRow, Metric, StatusDot } from "@/components/ui/Metric";
import { EmptyState } from "@/components/ui/EmptyState";
import { useMissionStore } from "@/store/missionStore";
import { useSimulationStore } from "@/store/simulationStore";
import { useEngineeringReport } from "@/hooks/useEngineering";
import { DESTINATION_PROFILES } from "@/data/missionObjectives";
import { DESTINATION_PLANETS, PLANET_BY_ID } from "@/data/planets";
import { LAUNCH_VEHICLE_BY_ID } from "@/data/launchVehicles";
import { num, percent, money } from "@/utils/format";
import type { DestinationId } from "@/types";

/**
 * Mission Control — the central dashboard.
 *
 * Shows the state of the active mission, the available destinations, the
 * resource picture and the recent event log, and provides the two entry
 * points into the design workflow.
 */
export function MissionControlPage() {
  const navigate = useNavigate();
  const missions = useMissionStore((state) => state.missions);
  const currentMissionId = useMissionStore((state) => state.currentMissionId);
  const reports = useMissionStore((state) => state.reports);
  const createMission = useMissionStore((state) => state.createMission);
  const selectMission = useMissionStore((state) => state.selectMission);

  const runtime = useSimulationStore((state) => state.runtime);
  const running = useSimulationStore((state) => state.running);
  const report = useEngineeringReport();

  const mission = missions.find((item) => item.id === currentMissionId) ?? null;
  const destination = mission ? PLANET_BY_ID[mission.destinationId] : null;

  const destinations = useMemo(
    () =>
      DESTINATION_PLANETS.map((planet) => ({
        planet,
        profile: DESTINATION_PROFILES[planet.id as DestinationId],
      })),
    [],
  );

  const startNewMission = () => {
    const created = createMission({ destinationId: "mars" });
    navigate("/planner");
    return created;
  };

  const continueMission = () => {
    if (!mission) return;
    if (runtime && runtime.missionId === mission.id) {
      navigate("/simulation");
      return;
    }
    navigate("/laboratory");
  };

  const vehicle = mission?.launchVehicleId ? LAUNCH_VEHICLE_BY_ID[mission.launchVehicleId] : null;

  return (
    <>
      <PageHeader
        eyebrow="MISSIONFORGE · MISSION CONTROL"
        title={mission ? mission.name : "No mission selected"}
        description={
          mission
            ? `Destination ${destination?.name} · ${mission.durationMonths} month science window · $${mission.budgetMillionUSD}M funding cap.`
            : "Design, build, launch and operate an interplanetary mission. Pick a destination to begin."
        }
        actions={
          <>
            <Button variant="primary" icon={<Plus size={13} />} onClick={startNewMission}>
              New mission
            </Button>
            <Button
              icon={runtime && runtime.missionId === mission?.id ? <Play size={13} /> : <ArrowRight size={13} />}
              onClick={continueMission}
              disabled={!mission}
            >
              {runtime && runtime.missionId === mission?.id ? "Resume flight" : "Continue mission"}
            </Button>
          </>
        }
      />

      <PageBody>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          {/* ---------------------------------------------------- left column */}
          <div className="space-y-4">
            <Panel
              title="Current mission telemetry"
              subtitle={mission ? `Last updated ${new Date(mission.updatedAt).toLocaleString()}` : undefined}
              beam={Boolean(mission && runtime)}
              actions={
                mission ? (
                  <Link
                    to="/planner"
                    className="font-mono text-[11px] text-white underline-offset-4 hover:underline"
                  >
                    [ EDIT CONFIG ]
                  </Link>
                ) : null
              }
            >
              {!mission ? (
                <EmptyState
                  icon={<Rocket size={20} strokeWidth={1.4} />}
                  title="No active mission"
                  description="Start a new mission to open the planner, or resume a mission you have already configured."
                  action={
                    <Button variant="primary" icon={<Plus size={13} />} onClick={startNewMission}>
                      Start new mission
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Metric label="Destination" value={destination?.name ?? "—"} size="sm" />
                  <Metric
                    label="Launch vehicle"
                    value={vehicle?.name ?? "Not selected"}
                    size="sm"
                    tone={vehicle ? "default" : "warning"}
                  />
                  <Metric
                    label="Elapsed"
                    value={runtime && runtime.missionId === mission.id ? `${num(runtime.elapsedDays, 0)} d` : "—"}
                    unit={runtime ? "of" : undefined}
                    size="sm"
                  />
                  <Metric
                    label="Science objectives"
                    value={
                      runtime && runtime.missionId === mission.id
                        ? `${runtime.objectives.filter((o) => o.complete).length}/${runtime.objectives.length}`
                        : "—"
                    }
                    size="sm"
                  />

                  <div className="col-span-2 sm:col-span-4">
                    <div className="hairline mt-1 grid grid-cols-1 gap-x-6 gap-y-0 pt-3 sm:grid-cols-2">
                      <DataRow label="Mass (launch)" value={`${num(report?.launchMassKg ?? 0, 0)} kg`} />
                      <DataRow
                        label="Mass margin"
                        value={report?.massMarginPct === null || report?.massMarginPct === undefined ? "—" : percent(report.massMarginPct)}
                        tone={
                          report?.massMarginPct === null || report?.massMarginPct === undefined
                            ? "default"
                            : report.massMarginPct < 0
                              ? "danger"
                              : report.massMarginPct < 8
                                ? "warning"
                                : "success"
                        }
                      />
                      <DataRow label="Power margin" value={report ? percent(report.power.marginPct) : "—"} tone={report?.power.deficit ? "danger" : report && report.power.marginPct < 12 ? "warning" : "success"} />
                      <DataRow
                        label="Budget used"
                        value={report ? `${money(report.totalCostMillionUSD)} of ${money(report.budgetCapMillionUSD)}` : "—"}
                        tone={report && report.totalCostMillionUSD > report.budgetCapMillionUSD ? "danger" : "default"}
                      />
                    </div>
                  </div>

                  {report && (report.blockingCount > 0 || report.warningCount > 0) ? (
                    <div className="col-span-2 mt-2 sm:col-span-4">
                      <div className="flex flex-wrap items-center gap-2 border border-white/10 bg-neutral-950 px-3 py-2">
                        <StatusDot
                          tone={report.blockingCount > 0 ? "danger" : "warning"}
                          pulse={report.blockingCount > 0}
                          label={
                            report.blockingCount > 0
                              ? `${report.blockingCount} blocking constraint${report.blockingCount === 1 ? "" : "s"}`
                              : `${report.warningCount} advisory warning${report.warningCount === 1 ? "" : "s"}`
                          }
                        />
                        <Link to="/laboratory" className="font-mono text-[11px] text-white underline-offset-4 hover:underline">
                          [ Review in the laboratory → ]
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </Panel>

            <Panel
              title="Recent mission events"
              subtitle={runtime ? "Live flight operations log" : "No flight has been started for this mission"}
              actions={
                runtime ? (
                  <Link to="/simulation" className="font-mono text-[11px] text-white underline-offset-4 hover:underline">
                    [ OPEN SIMULATION → ]
                  </Link>
                ) : null
              }
            >
              {!runtime || runtime.events.length === 0 ? (
                <EmptyState
                  icon={<Activity size={20} strokeWidth={1.4} />}
                  title="No events yet"
                  description="Mission events appear here once the spacecraft is launched."
                />
              ) : (
                <ul className="space-y-2">
                  {runtime.events
                    .slice()
                    .reverse()
                    .slice(0, 6)
                    .map((event) => (
                      <li key={event.id} className="flex gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
                        <div className="value-num w-16 shrink-0 pt-0.5 text-[11px] text-ink-muted">
                          T+{num(event.day, 1)}d
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <StatusDot
                              tone={
                                event.severity === "danger"
                                  ? "danger"
                                  : event.severity === "warning"
                                    ? "warning"
                                    : event.severity === "success"
                                      ? "success"
                                      : "accent"
                              }
                            />
                            <span className="truncate text-[12px] font-medium text-ink">{event.title}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">{event.message}</p>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </Panel>
          </div>

          {/* --------------------------------------------------- right column */}
          <div className="space-y-4">
            <Panel title="Available destinations" subtitle="Select a target in the planner to begin a mission">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {destinations.map(({ planet, profile }) => {
                  const active = mission?.destinationId === planet.id;
                  return (
                    <button
                      key={planet.id}
                      type="button"
                      onClick={() => {
                        if (!active) {
                          const created = createMission({
                            destinationId: planet.id as DestinationId,
                            name: `${planet.name} Mission`,
                          });
                          void created;
                        }
                        navigate("/planner");
                      }}
                      className={`group relative flex items-center gap-3 border px-3 py-2.5 text-left font-mono transition-all ${
                        active
                          ? "border-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                          : "border-white/10 bg-[#0d0d0d] hover:border-white/30 hover:bg-[#161616]"
                      }`}
                    >
                      <span
                        className="h-6 w-6 shrink-0 rounded-full border border-white/20 shadow-[0_0_8px_rgba(255,255,255,0.15)]"
                        style={{
                          background: `radial-gradient(circle at 32% 30%, ${planet.accent}, ${planet.color} 62%, #000000 100%)`,
                        }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[12px] font-bold text-white">{planet.name}</span>
                          {active ? (
                            <span className="label-tech text-white">[ SELECTED ]</span>
                          ) : (
                            <span className="label-tech text-neutral-400">{planet.type}</span>
                          )}
                        </span>
                        <span className="value-num mt-0.5 block text-[10px] text-neutral-400">
                          {planet.semiMajorAxisAU.toFixed(2)} AU · {money(profile.budgetMillionUSD, 0)} cap ·{" "}
                          {profile.difficulty}
                        </span>
                      </span>
                      <ArrowRight size={13} className="shrink-0 text-neutral-400 transition-colors group-hover:text-white" />
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Panel title="Mission archive" subtitle={`${missions.length} mission${missions.length === 1 ? "" : "s"} configured`}>
              {missions.length === 0 ? (
                <EmptyState
                  icon={<Target size={20} strokeWidth={1.4} />}
                  title="No missions yet"
                  description="Configured missions are saved locally in this browser."
                />
              ) : (
                <ul className="space-y-1.5">
                  {missions.slice(0, 6).map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          selectMission(item.id);
                          navigate("/planner");
                        }}
                        className={`flex w-full items-center gap-3 border px-3 py-2 text-left transition-colors ${
                          item.id === currentMissionId
                            ? "border-accent/50 bg-accent/10"
                            : "border-line bg-abyss/50 hover:bg-elevated"
                        }`}
                      >
                        <Satellite size={13} className="shrink-0 text-ink-muted" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] text-ink">{item.name}</span>
                          <span className="value-num block text-[10px] text-ink-muted">
                            {PLANET_BY_ID[item.destinationId].name} · {item.durationMonths} mo
                          </span>
                        </span>
                        <StatusDot tone={item.status === "complete" ? "success" : item.status === "failed" ? "danger" : "default"} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {reports.length > 0 ? (
                <div className="mt-3 border-t border-line pt-3">
                  <div className="label-tech mb-2">Completed reports</div>
                  <ul className="space-y-1">
                    {reports.slice(0, 4).map((item) => (
                      <li key={`${item.missionId}-${item.generatedAt}`}>
                        <Link
                          to="/evaluation"
                          className="flex items-center justify-between gap-3 px-1 py-1 text-[11px] text-ink-muted transition-colors hover:text-ink"
                        >
                          <span className="truncate">{item.missionName}</span>
                          <span className="value-num text-accent">{item.score}/100</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Panel>

            <Panel title="Environment">
              <div className="flex items-center gap-3">
                <Compass size={16} className="text-ink-muted" />
                <p className="text-[11px] leading-relaxed text-ink-muted">
                  The navigator renders the whole solar system with a compressed visual scale. Open it to inspect
                  planetary data before committing to a target.
                </p>
                <Link to="/navigator" className="shrink-0 text-[11px] text-accent underline-offset-2 hover:underline">
                  Open
                </Link>
              </div>
              <div className="mt-3 flex items-center gap-2 border border-line bg-abyss/60 px-3 py-2">
                <CircleDot size={12} className={running ? "animate-pulse-dot text-success" : "text-ink-muted"} />
                <span className="text-[11px] text-ink-muted">
                  {running ? "Simulation running" : "Simulation idle"}
                </span>
              </div>
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  );
}
