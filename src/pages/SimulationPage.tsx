import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Gauge,
  Pause,
  Play,
  Rocket,
  RotateCcw,
  Zap,
} from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button, IconButton } from "@/components/ui/Button";
import { DataRow, Metric, StatusDot } from "@/components/ui/Metric";
import { EmptyState } from "@/components/ui/EmptyState";
import { MissionTimeline } from "@/components/simulation/MissionTimeline";
import { EventDecisionModal } from "@/components/simulation/EventDecisionModal";
import { SceneCanvas } from "@/three/SceneCanvas";
import { SolarSystem } from "@/three/SolarSystem";
import { CameraRig } from "@/three/CameraRig";
import { PLANET_BY_ID } from "@/data/planets";
import { PHASE_LABELS } from "@/engine/simulation";
import { useMissionStore } from "@/store/missionStore";
import { useSimulationStore, type SimulationSpeed } from "@/store/simulationStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useActiveBuild } from "@/hooks/useEngineering";
import { useSimulationClock } from "@/hooks/useSimulationClock";
import { missionClock, num, percent } from "@/utils/format";
import { sound } from "@/utils/sound";

const SPEEDS: SimulationSpeed[] = [1, 2, 4, 8];

/**
 * Mission Simulation.
 *
 * The flight environment: a live 3D view of the spacecraft along the planned
 * trajectory, the mission timeline, the controls and the event log.
 */
export function SimulationPage() {
  const navigate = useNavigate();
  const mission = useMissionStore((state) =>
    state.missions.find((item) => item.id === state.currentMissionId),
  );
  const updateMission = useMissionStore((state) => state.updateMission);
  const settings = useSettingsStore();

  const runtime = useSimulationStore((state) => state.runtime);
  const config = useSimulationStore((state) => state.config);
  const running = useSimulationStore((state) => state.running);
  const speed = useSimulationStore((state) => state.speed);
  const awaitingDecision = useSimulationStore((state) => state.awaitingDecision);
  const launch = useSimulationStore((state) => state.launch);
  const toggle = useSimulationStore((state) => state.toggle);
  const setSpeed = useSimulationStore((state) => state.setSpeed);
  const decide = useSimulationStore((state) => state.decide);
  const reset = useSimulationStore((state) => state.reset);

  const build = useActiveBuild();
  useSimulationClock(true);

  // The simulation clock drives the store directly.
  useEffect(() => {
    if (runtime?.completed && runtime.outcome) {
      updateMission(mission?.id ?? "", { status: runtime.outcome === "failure" ? "failed" : "complete" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtime?.completed]);

  const trajectoryProgress = useMemo(() => {
    if (!runtime) return 0;
    if (runtime.elapsedDays < 6) return 0;
    const span = Math.max(1e-6, runtime.cruiseEndDay - 6);
    return Math.min(1, (runtime.elapsedDays - 6) / span);
  }, [runtime]);

  if (!mission) {
    return (
      <>
        <PageHeader eyebrow="FLIGHT OPERATIONS" title="Mission Simulation" />
        <PageBody>
          <Panel>
            <EmptyState
              icon={<Rocket size={20} strokeWidth={1.4} />}
              title="No active mission"
              description="Configure a mission before launching a spacecraft."
              action={
                <Button variant="primary" onClick={() => navigate("/planner")}>
                  Open the mission planner
                </Button>
              }
            />
          </Panel>
        </PageBody>
      </>
    );
  }

  const hasFlight = Boolean(runtime && config && runtime.missionId === mission.id);

  return (
    <>
      <PageHeader
        eyebrow="FLIGHT OPERATIONS"
        title={mission.name}
        description={`Destination ${PLANET_BY_ID[mission.destinationId].name} · ${mission.durationMonths} month science window.`}
        actions={
          <>
            {hasFlight ? (
              <>
                <Button
                  size="sm"
                  variant={running ? "secondary" : "primary"}
                  icon={running ? <Pause size={13} /> : <Play size={13} />}
                  onClick={() => {
                    sound.snap();
                    toggle();
                  }}
                  disabled={awaitingDecision || runtime?.completed}
                >
                  {running ? "Hold flight" : "Resume flight"}
                </Button>
                <Button size="sm" icon={<RotateCcw size={13} />} onClick={() => { sound.warning(); reset(); }}>
                  Reset flight
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<ArrowRight size={13} />}
                  onClick={() => navigate("/telemetry")}
                >
                  Telemetry
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                icon={<Rocket size={13} />}
                onClick={() => {
                  sound.rumble();
                  launch({
                    missionId: mission.id,
                    missionName: mission.name,
                    destination: mission.destinationId,
                    durationMonths: mission.durationMonths,
                    spacecraft: build,
                    launchVehicleId: mission.launchVehicleId,
                  });
                  updateMission(mission.id, { status: "launched" });
                }}
              >
                Launch mission
              </Button>
            )}
          </>
        }
      />

      <PageBody>
        {!hasFlight ? (
          <Panel title="Pre-flight">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div>
                <p className="text-[12px] leading-relaxed text-ink-muted">
                  The spacecraft is configured and the trajectory is planned. Launching will start the mission clock and
                  run the flight through nine phases: launch, orbital insertion, deployment, interplanetary cruise,
                  course correction, destination arrival, scientific operations and mission completion.
                </p>
                <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
                  The simulation reacts to the actual build. Events are drawn from a pool filtered by destination and
                  power architecture, and every decision changes the outcome.
                </p>
                <Button
                  className="mt-4"
                  variant="primary"
                  icon={<Rocket size={13} />}
                  onClick={() => {
                    launch({
                      missionId: mission.id,
                      missionName: mission.name,
                      destination: mission.destinationId,
                      durationMonths: mission.durationMonths,
                      spacecraft: build,
                      launchVehicleId: mission.launchVehicleId,
                    });
                    updateMission(mission.id, { status: "launched" });
                  }}
                >
                  Launch mission
                </Button>
              </div>
              <div className="border border-line bg-abyss/50 p-4">
                <div className="label-tech mb-2">Launch checklist</div>
                <ul className="space-y-1.5 text-[11px] text-ink-muted">
                  <li>· Destination confirmed: {PLANET_BY_ID[mission.destinationId].name}</li>
                  <li>· Spacecraft configuration loaded from the laboratory</li>
                  <li>· Launch vehicle: {mission.launchVehicleId ?? "not selected"}</li>
                  <li>· Science window: {mission.durationMonths} months</li>
                  <li>· Funding cap: ${mission.budgetMillionUSD}M</li>
                </ul>
              </div>
            </div>
          </Panel>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-4">
              <div className="panel relative overflow-hidden">
                <SceneCanvas
                  quality={settings.graphicsQuality}
                  cameraPosition={[0, 30, 54]}
                  className="h-[380px] w-full lg:h-[470px]"
                >
                  <SolarSystem
                    quality={settings.graphicsQuality}
                    selectedId={mission.destinationId}
                    destinationId={mission.destinationId}
                    showOrbits={settings.showOrbits}
                    showLabels={settings.showLabels}
                    epochDays={runtime?.elapsedDays ?? 0}
                    showTrajectory
                    trajectoryProgress={trajectoryProgress}
                  />
                  <CameraRig focus={[0, 0, 0]} distance={54} minDistance={3} maxDistance={200} />
                </SceneCanvas>

                <div className="pointer-events-none absolute left-3 top-3 border border-line bg-void/85 px-2.5 py-1.5">
                  <div className="label-tech">{PHASE_LABELS[runtime?.phase ?? "pre-launch"]}</div>
                  <div className="value-num mt-0.5 text-[13px] text-accent">
                    {missionClock(runtime?.elapsedDays ?? 0)}
                  </div>
                </div>

                {runtime?.completed ? (
                  <div className="pointer-events-none absolute right-3 top-3 border border-line bg-void/85 px-2.5 py-1.5">
                    <StatusDot
                      tone={runtime.outcome === "failure" ? "danger" : "success"}
                      label={runtime.outcome === "failure" ? "MISSION FAILED" : "MISSION COMPLETE"}
                    />
                  </div>
                ) : null}
              </div>

              <Panel title="Mission timeline">
                <MissionTimeline
                  currentPhase={runtime?.phase ?? "pre-launch"}
                  elapsedDays={runtime?.elapsedDays ?? 0}
                  cruiseEndDay={runtime?.cruiseEndDay ?? 0}
                  arrivalDay={runtime?.arrivalDay ?? 0}
                  operationsEndDay={runtime?.operationsEndDay ?? 0}
                />
                <div className="hairline mt-4 pt-3">
                  <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
                    <DataRow
                      label="Cruise ends"
                      value={`day ${num(runtime?.cruiseEndDay ?? 0, 0)}`}
                    />
                    <DataRow
                      label="Arrival"
                      value={`day ${num(runtime?.arrivalDay ?? 0, 0)}`}
                    />
                    <DataRow
                      label="Science ends"
                      value={`day ${num(runtime?.operationsEndDay ?? 0, 0)}`}
                    />
                    <DataRow
                      label="Elapsed"
                      value={`${num(runtime?.elapsedDays ?? 0, 1)} days`}
                    />
                  </div>
                </div>
              </Panel>

              <Panel title="Event log" subtitle="Mission operations record">
                {!runtime || runtime.events.length === 0 ? (
                  <EmptyState
                    icon={<Activity size={20} strokeWidth={1.4} />}
                    title="No events recorded"
                    description="Events appear as the flight progresses. Some require a decision."
                  />
                ) : (
                  <ul className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                    {runtime.events
                      .slice()
                      .reverse()
                      .map((event) => (
                        <li key={event.id} className="flex gap-3 border-b border-line pb-2 last:border-0">
                          <div className="value-num w-20 shrink-0 pt-0.5 text-[11px] text-ink-muted">
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

            {/* ---------------------------------------------------- side rail */}
            <div className="space-y-4">
              <Panel title="Flight controls">
                <div className="flex items-center gap-2">
                  <IconButton
                    label={running ? "Pause simulation" : "Resume simulation"}
                    icon={running ? <Pause size={15} /> : <Play size={15} />}
                    onClick={toggle}
                    disabled={awaitingDecision || runtime?.completed}
                    className="border border-line bg-elevated"
                  />
                  <div className="flex flex-1 gap-1">
                    {SPEEDS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          sound.click(1400 + value * 200, 0.01);
                          setSpeed(value);
                        }}
                        className={`value-num flex-1 rounded-[2px] border px-2 py-1.5 font-mono text-[11px] transition-all ${
                          speed === value
                            ? "border-white bg-white text-black font-bold shadow-[0_0_10px_white]"
                            : "border-white/10 bg-[#0c0c0c] text-neutral-400 hover:border-white/30 hover:text-white"
                        }`}
                      >
                        {value}×
                      </button>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-ink-muted">
                  The simulation advances in fixed 0.25-day steps, so a mission flown at 8× produces exactly the same
                  result as the same mission flown at 1×.
                </p>
                {awaitingDecision ? (
                  <div className="mt-3 border border-warning/40 bg-warning/10 px-3 py-2">
                    <div className="flex items-center gap-2 text-[11px] text-warning">
                      <Zap size={12} /> A decision is required. The simulation is paused.
                    </div>
                  </div>
                ) : null}
              </Panel>

              {runtime ? (
                <Panel title="Live telemetry">
                  <div className="grid grid-cols-2 gap-4">
                    <Metric
                      label="Spacecraft health"
                      value={num(runtime.health, 0)}
                      unit="%"
                      size="sm"
                      tone={runtime.health > 60 ? "success" : runtime.health > 30 ? "warning" : "danger"}
                    />
                    <Metric
                      label="Battery"
                      value={percent(runtime.batteryWh / Math.max(1, runtime.batteryCapacityWh) * 100, 0)}
                      size="sm"
                      tone={runtime.batteryWh / Math.max(1, runtime.batteryCapacityWh) > 0.35 ? "success" : "warning"}
                    />
                    <Metric
                      label="Power"
                      value={num(runtime.generatedW, 1)}
                      unit="W gen"
                      size="sm"
                      tone={runtime.generatedW >= runtime.loadW ? "success" : "danger"}
                      detail={`load ${num(runtime.loadW, 1)} W`}
                    />
                    <Metric
                      label="Link quality"
                      value={percent(runtime.commLink * 100, 0)}
                      size="sm"
                      tone={runtime.commLink > 0.4 ? "success" : runtime.commLink > 0.15 ? "warning" : "danger"}
                    />
                    <Metric
                      label="Range from Earth"
                      value={num(runtime.rangeAU, 2)}
                      unit="AU"
                      size="sm"
                    />
                    <Metric
                      label="Propellant"
                      value={num(runtime.fuelKg, 0)}
                      unit="kg"
                      size="sm"
                      tone={runtime.fuelKg / Math.max(1, runtime.fuelInitialKg) > 0.25 ? "default" : "warning"}
                    />
                    <Metric label="Science" value={num(runtime.science, 1)} unit="pts" size="sm" tone="accent" />
                    <Metric label="Electronics" value={num(runtime.thermalC, 0)} unit="°C" size="sm" />
                  </div>

                  <div className="hairline mt-3 pt-3">
                    <DataRow label="Data returned" value={`${num(runtime.dataTransmittedGbit, 1)} Gbit`} />
                    <DataRow label="Data lost" value={`${num(runtime.dataLostGbit, 1)} Gbit`} tone={runtime.dataLostGbit > 0 ? "warning" : "default"} />
                    <DataRow label="Power deficit days" value={num(runtime.powerDeficitDays, 1)} tone={runtime.powerDeficitDays > 0 ? "danger" : "default"} />
                  </div>
                </Panel>
              ) : null}

              {runtime && runtime.objectives.length > 0 ? (
                <Panel title="Scientific objectives">
                  <ul className="space-y-2.5">
                    {runtime.objectives.map((objective) => (
                      <li key={objective.objectiveId}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-[11px] leading-snug text-ink">{objective.title}</span>
                          <span
                            className={`value-num text-[11px] ${objective.complete ? "text-success" : "text-ink-muted"}`}
                          >
                            {percent(objective.progress * 100, 0)}
                          </span>
                        </div>
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-line/70">
                          <div
                            className={`h-full ${objective.complete ? "bg-success" : "bg-accent"}`}
                            style={{ width: `${Math.min(100, objective.progress * 100)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ) : null}

              <Panel title="Next">
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    icon={<Gauge size={13} />}
                    onClick={() => navigate("/telemetry")}
                  >
                    Open full telemetry
                  </Button>
                  <Button
                    className="w-full"
                    variant="primary"
                    icon={<ArrowRight size={13} />}
                    onClick={() => navigate("/evaluation")}
                  >
                    Mission evaluation
                  </Button>
                </div>
              </Panel>
            </div>
          </div>
        )}
      </PageBody>

      {hasFlight && runtime && config && awaitingDecision ? (
        <EventDecisionModal runtime={runtime} config={config} onDecide={decide} />
      ) : null}
    </>
  );
}
