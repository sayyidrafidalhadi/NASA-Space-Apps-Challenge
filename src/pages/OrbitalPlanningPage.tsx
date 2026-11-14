import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, Orbit, Rocket, Target } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { DataRow, Metric, StatusDot } from "@/components/ui/Metric";
import { EmptyState } from "@/components/ui/EmptyState";
import { SceneCanvas } from "@/three/SceneCanvas";
import { SolarSystem } from "@/three/SolarSystem";
import { CameraRig } from "@/three/CameraRig";
import { SCENE_SCALE_NOTICE_SHORT, scenePosition } from "@/three/scale";
import { PLANET_BY_ID } from "@/data/planets";
import { DESTINATION_DELTAV_CLASS_KMS } from "@/data/launchVehicles";
import { planTransfer } from "@/engine/orbitalMechanics";
import { useMissionStore } from "@/store/missionStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useEngineeringReport } from "@/hooks/useEngineering";
import { num, velocity } from "@/utils/format";

/**
 * Orbital Planning.
 *
 * Shows the planned transfer between Earth and the destination, the energy
 * required to fly it, and the propellant that demands. The model is a
 * simplified Hohmann transfer and the assumptions are stated on screen.
 */
export function OrbitalPlanningPage() {
  const navigate = useNavigate();
  const mission = useMissionStore((state) =>
    state.missions.find((item) => item.id === state.currentMissionId),
  );
  const settings = useSettingsStore();
  const report = useEngineeringReport();

  const destinationId = mission?.destinationId ?? "mars";
  const destination = PLANET_BY_ID[destinationId];

  const transfer = useMemo(() => planTransfer("earth", destinationId), [destinationId]);
  const focus = useMemo(() => scenePosition(destinationId), [destinationId]);

  if (!mission) {
    return (
      <>
        <PageHeader eyebrow="TRAJECTORY" title="Orbital Planning" />
        <PageBody>
          <Panel>
            <EmptyState
              icon={<Orbit size={20} strokeWidth={1.4} />}
              title="No active mission"
              description="A destination is needed before a transfer can be planned."
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

  const shortfall = report?.deltaVShortfallMs ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="TRAJECTORY"
        title="Orbital Planning"
        description={`A two-impulse transfer from Earth to ${destination.name}, with the energy budget and the propellant it demands.`}
        actions={
          <Button variant="primary" icon={<ArrowRight size={13} />} onClick={() => navigate("/simulation")}>
            Go to flight operations
          </Button>
        }
      />

      <PageBody>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="panel relative overflow-hidden">
              <SceneCanvas
                quality={settings.graphicsQuality}
                cameraPosition={[0, 34, 58]}
                className="h-[460px] w-full lg:h-[560px]"
              >
                <SolarSystem
                  quality={settings.graphicsQuality}
                  selectedId={destinationId}
                  destinationId={destinationId}
                  showOrbits={settings.showOrbits}
                  showLabels={settings.showLabels}
                  showTrajectory
                  trajectoryProgress={0}
                />
                <CameraRig focus={[focus[0] * 0.35, 0, focus[2] * 0.35]} distance={48} minDistance={3} maxDistance={200} />
              </SceneCanvas>

              {/* Optical Scanline & Telemetry Tag */}
              <div className="pointer-events-none absolute inset-0 scanline-overlay opacity-30" />
              <div className="pointer-events-none absolute left-3 top-3 font-mono text-[9px] uppercase tracking-widest text-white/40">
                [ HOHMANN TRANSFER SOLVER · KEPLERIAN_2D_ECLIPTIC ]
              </div>

              <div className="pointer-events-none absolute bottom-3 left-3 border border-white/10 bg-black/85 px-3 py-2 font-mono backdrop-blur-sm">
                <div className="label-tech mb-0.5 text-white/60">{SCENE_SCALE_NOTICE_SHORT}</div>
                <p className="text-[10px] text-neutral-400">
                  The plotted ellipse is a simplified Hohmann transfer in the compressed visual scale.
                </p>
              </div>

              <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-4 border border-white/10 bg-black/85 px-3 py-1.5 font-mono backdrop-blur-sm">
                <span className="flex items-center gap-1.5 text-[10px] text-neutral-300">
                  <span className="inline-block h-2 w-2 rounded-full bg-white shadow-[0_0_8px_white]" /> Transfer path
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-neutral-300">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88]" /> Spacecraft
                </span>
              </div>
            </div>

            <Panel title="Transfer geometry">
              <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                <div>
                  <DataRow label="Departure body" value="Earth" />
                  <DataRow label="Departure radius" value={`${num(transfer.departureRadiusM / 1.495978707e11, 3)} AU`} />
                  <DataRow label="Departure speed" value={velocity(transfer.departureSpeedMs)} />
                  <DataRow label="Transfer periapsis speed" value={velocity(transfer.transferPeriapsisSpeedMs)} />
                  <DataRow label="Departure Δv" value={velocity(transfer.departureDeltaVMs)} />
                </div>
                <div>
                  <DataRow label="Arrival body" value={destination.name} />
                  <DataRow label="Arrival radius" value={`${num(transfer.arrivalRadiusM / 1.495978707e11, 3)} AU`} />
                  <DataRow label="Arrival speed" value={velocity(transfer.arrivalSpeedMs)} />
                  <DataRow label="Transfer apoapsis speed" value={velocity(transfer.transferApoapsisSpeedMs)} />
                  <DataRow label="Arrival Δv" value={velocity(transfer.arrivalDeltaVMs)} />
                </div>
              </div>

              <div className="hairline mt-4 pt-3">
                <div className="label-tech mb-2">Model assumptions</div>
                <ul className="space-y-1 text-[11px] leading-relaxed text-ink-muted">
                  <li>· Coplanar circular orbits; real planetary orbits are elliptical and slightly inclined.</li>
                  <li>· A two-impulse Hohmann transfer with no gravity assist and no launch-window waiting.</li>
                  <li>· No inclination change, plane change or out-of-plane correction is costed.</li>
                  <li>· Arrival capture is a single circularisation burn at the destination's orbital radius.</li>
                  <li>· The mission budget adds a launch escape burn, a course-correction reserve and a landing burn.</li>
                </ul>
              </div>
            </Panel>
          </div>

          {/* ------------------------------------------------------- side rail */}
          <div className="space-y-4">
            <Panel title="Transfer profile">
              <div className="grid grid-cols-2 gap-4">
                <Metric
                  label="Transfer time"
                  value={num(transfer.timeOfFlightDays, 0)}
                  unit="days"
                  size="sm"
                  detail={`${num(transfer.timeOfFlightMonths, 1)} months`}
                />
                <Metric
                  label="Heliocentric Δv"
                  value={num(transfer.totalDeltaVMs / 1000, 2)}
                  unit="km/s"
                  size="sm"
                />
              </div>
              <div className="hairline mt-3 pt-3">
                <DataRow
                  label="Required phase angle"
                  value={`${num((transfer.departurePhaseAngleRad * 180) / Math.PI, 1)}°`}
                />
                <DataRow
                  label="Current phase angle"
                  value={`${num((transfer.currentPhaseAngleRad * 180) / Math.PI, 1)}°`}
                />
                <DataRow
                  label="Next window"
                  value={
                    transfer.daysToWindow > 0
                      ? `in ${num(transfer.daysToWindow, 0)} days`
                      : "open now"
                  }
                  tone={transfer.daysToWindow < 30 ? "success" : "default"}
                />
                <DataRow
                  label="Destination Δv class"
                  value={`${num(DESTINATION_DELTAV_CLASS_KMS[destinationId], 1)} km/s`}
                />
              </div>
              <p className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-ink-muted">
                <Clock size={11} className="mt-0.5 shrink-0" />
                The window figure is how long until the two planets reach the relative geometry a Hohmann transfer needs.
                The simulation does not force a wait — it launches on the schedule the player chooses.
              </p>
            </Panel>

            <Panel title="Mission Δv budget">
              {report ? (
                <>
                  <div className="mb-2 flex items-center gap-2 border border-line bg-abyss/60 px-3 py-2">
                    <span className="label-tech">Launch vehicle upper stage</span>
                    <span className="value-num text-[11px] text-ink-muted">
                      provides {num(report.deltaV.launchDeltaVKms + report.deltaV.injectionDeltaVKms, 2)} km/s
                    </span>
                  </div>
                  <div className="space-y-0">
                    <DataRow
                      label="Earth departure (LEO escape)"
                      value={velocity(report.deltaV.launchDeltaVKms * 1000)}
                    />
                    <DataRow
                      label="Heliocentric injection"
                      value={velocity(report.deltaV.injectionDeltaVKms * 1000)}
                    />
                    <DataRow label="Orbit insertion" value={velocity(report.deltaV.insertionDeltaVKms * 1000)} />
                    <DataRow label="Arrival capture" value={velocity(report.deltaV.captureDeltaVKms * 1000)} />
                    <DataRow
                      label="Course correction reserve"
                      value={velocity(report.deltaV.courseCorrectionDeltaVKms * 1000)}
                    />
                    <DataRow label="Landing" value={velocity(report.deltaV.landingDeltaVKms * 1000)} />
                  </div>
                  <div className="hairline mt-3 pt-3">
                    <div className="flex items-baseline justify-between">
                      <span className="label-tech">Spacecraft must produce</span>
                      <span className="value-num text-[15px] text-ink">
                        {num(report.deltaV.spacecraftDeltaVKms, 2)} km/s
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="label-tech">Available from propellant</span>
                      <span
                        className={`value-num text-[15px] ${shortfall > 0 ? "text-danger" : "text-success"}`}
                      >
                        {num(report.propulsion.remainingDeltaVMs / 1000, 2)} km/s
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 border border-line bg-abyss/60 px-3 py-2">
                    <StatusDot
                      tone={shortfall > 0 ? "danger" : "success"}
                      label={shortfall > 0 ? `SHORT BY ${num(shortfall / 1000, 2)} km/s` : "PROPELLANT SUFFICIENT"}
                    />
                  </div>
                  <p className="mt-3 text-[10px] leading-relaxed text-ink-muted">
                    The Earth departure burn and the heliocentric injection are provided by the launch vehicle's upper
                    stage. The spacecraft pays for orbit insertion, its course correction, the arrival capture and — for
                    an inner-planet lander — the landing burn.
                  </p>
                </>
              ) : null}
            </Panel>

            <Panel title="Propellant">
              {report ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Metric label="Loaded" value={num(report.propulsion.propellantKg, 0)} unit="kg" size="sm" />
                    <Metric label="Specific impulse" value={num(report.propulsion.ispSeconds, 0)} unit="s" size="sm" />
                    <Metric label="Dry mass" value={num(report.propulsion.dryMassKg, 0)} unit="kg" size="sm" />
                    <Metric
                      label="Thrust"
                      value={num(report.parts.propulsion.thrustN ?? 0, 0)}
                      unit="N"
                      size="sm"
                    />
                  </div>
                  <div className="hairline mt-3 pt-3">
                    <DataRow
                      label="Mass ratio"
                      value={num(report.propulsion.massRatio, 3)}
                    />
                    <DataRow
                      label="Theoretical maximum Δv"
                      value={velocity(report.propulsion.theoreticalMaxDeltaVMs)}
                    />
                  </div>
                  <p className="mt-3 text-[10px] leading-relaxed text-ink-muted">
                    The Tsiolkovsky equation assumes a single ideal impulsive burn. Real mission budgets add gravity and
                    drag losses, finite-burn losses, tank residuals and throttleable-thrust penalties — typically 10–30%
                    more than the figure above.
                  </p>
                </>
              ) : null}
            </Panel>

            <Panel title="Trajectory status">
              <div className="space-y-2 text-[11px] leading-relaxed text-ink-muted">
                <div className="flex items-center gap-2">
                  <Rocket size={12} className="shrink-0 text-accent" />
                  <span>Origin: Earth · {num(transfer.departurePeriodS / 86400, 0)} day orbit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target size={12} className="shrink-0 text-accent" />
                  <span>
                    Destination: {destination.name} · {num(transfer.arrivalPeriodS / 86400, 0)} day orbit
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Orbit size={12} className="shrink-0 text-accent" />
                  <span>
                    Transfer semi-major axis{" "}
                    {num(transfer.transferSemiMajorAxisM / 1.495978707e11, 3)} AU
                  </span>
                </div>
              </div>
              <Button
                className="mt-3 w-full"
                variant="primary"
                icon={<ArrowRight size={13} />}
                onClick={() => navigate("/simulation")}
              >
                Proceed to flight operations
              </Button>
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  );
}
