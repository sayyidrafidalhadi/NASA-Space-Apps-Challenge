import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crosshair, Layers, Ruler, Target, Zap } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { DataRow, Metric } from "@/components/ui/Metric";
import { SceneCanvas } from "@/three/SceneCanvas";
import { SolarSystem } from "@/three/SolarSystem";
import { CameraRig } from "@/three/CameraRig";
import { SCENE_SCALE_NOTICE, SCENE_SCALE_NOTICE_SHORT, bodyRadius, orbitRadius, scenePosition } from "@/three/scale";
import { isDestination, PLANETS, PLANET_BY_ID } from "@/data/planets";
import { DESTINATION_PROFILES } from "@/data/missionObjectives";
import { useMissionStore } from "@/store/missionStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useSimulationStore } from "@/store/simulationStore";
import type { BodyId } from "@/types";
import { num } from "@/utils/format";
import { sound } from "@/utils/sound";

/**
 * Solar System Navigator.
 *
 * An interactive 3D view of the Sun and the eight planets, with physical
 * data for whichever body is selected. The scene uses a compressed
 * visualisation scale, which is stated on screen.
 */
export function NavigatorPage() {
  const navigate = useNavigate();
  const settings = useSettingsStore();
  const mission = useMissionStore((state) =>
    state.missions.find((item) => item.id === state.currentMissionId),
  );
  const updateMission = useMissionStore((state) => state.updateMission);
  const runtime = useSimulationStore((state) => state.runtime);

  const [selectedId, setSelectedId] = useState<BodyId>(mission?.destinationId ?? "earth");
  const [focusDistance, setFocusDistance] = useState<number | undefined>(undefined);

  const selected = PLANET_BY_ID[selectedId];
  const destinationId = mission?.destinationId ?? null;

  const focus = useMemo(() => scenePosition(selectedId), [selectedId]);

  const trajectoryProgress = useMemo(() => {
    if (!runtime) return 0;
    if (runtime.elapsedDays < 6) return 0;
    const span = Math.max(1e-6, runtime.cruiseEndDay - 6);
    return Math.min(1, (runtime.elapsedDays - 6) / span);
  }, [runtime]);

  const profile = isDestination(selectedId) ? DESTINATION_PROFILES[selectedId] : undefined;
  const canTarget = selectedId !== "sun" && Boolean(profile);

  return (
    <>
      <PageHeader
        eyebrow="NAVIGATION"
        title="Solar System Navigator"
        description="Inspect every destination in the catalogue. Select a body to read its physical data, environment and science objectives."
        actions={
          <>
            <Button
              size="sm"
              icon={<Layers size={13} />}
              onClick={settings.toggleOrbits}
              active={settings.showOrbits}
            >
              Orbits
            </Button>
            <Button
              size="sm"
              icon={<Crosshair size={13} />}
              onClick={settings.toggleLabels}
              active={settings.showLabels}
            >
              Labels
            </Button>
          </>
        }
      />

      <PageBody>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-3">
            <div className="panel relative overflow-hidden">
              <SceneCanvas
                quality={settings.graphicsQuality}
                cameraPosition={[0, 20, 48]}
                className="h-[520px] w-full lg:h-[640px]"
              >
                <SolarSystem
                  quality={settings.graphicsQuality}
                  selectedId={selectedId}
                  destinationId={destinationId}
                  showOrbits={settings.showOrbits}
                  showLabels={settings.showLabels}
                  epochDays={runtime?.elapsedDays ?? 0}
                  onSelect={(id) => {
                    sound.click(1800, 0.01);
                    setSelectedId(id);
                    setFocusDistance(undefined);
                  }}
                  showTrajectory={Boolean(destinationId)}
                  trajectoryProgress={trajectoryProgress}
                />
                <CameraRig focus={focus} distance={focusDistance} minDistance={1.2} maxDistance={220} />
              </SceneCanvas>

              {/* Optical HUD Crosshairs */}
              <div className="pointer-events-none absolute inset-0 scanline-overlay opacity-30" />
              <div className="pointer-events-none absolute left-3 top-3 font-mono text-[9px] uppercase tracking-widest text-white/40">
                [ ORBITAL CAMERA RIG · CAM_3D_LIVE ]
              </div>

              {settings.showScaleNotice ? (
                <div className="pointer-events-none absolute bottom-3 left-3 max-w-[330px] border border-white/10 bg-black/85 px-3 py-2 font-mono backdrop-blur-sm">
                  <div className="label-tech mb-0.5 flex items-center gap-1.5 text-white/60">
                    <Ruler size={11} /> {SCENE_SCALE_NOTICE_SHORT}
                  </div>
                  <p className="text-[10px] leading-snug text-neutral-400">{SCENE_SCALE_NOTICE}</p>
                </div>
              ) : null}

              <div className="pointer-events-none absolute bottom-3 right-3 border border-white/10 bg-black/85 px-3 py-1.5 font-mono text-[10px] text-neutral-400 backdrop-blur-sm">
                <span className="value-num">
                  {selected.name} · r = {num(orbitRadius(selected.semiMajorAxisAU), 1)} u · R ={" "}
                  {num(bodyRadius(selected.radiusKm), 2)} u
                </span>
              </div>
            </div>

            {/* Quick selection strip. */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
              {PLANETS.map((planet) => (
                <button
                  key={planet.id}
                  type="button"
                  onClick={() => {
                    sound.click(1600, 0.01);
                    setSelectedId(planet.id);
                  }}
                  className={`flex flex-col items-center gap-1.5 border px-2 py-2 font-mono transition-all ${
                    selectedId === planet.id
                      ? "border-white bg-white/10 shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                      : "border-white/10 bg-[#0a0a0a] hover:border-white/30 hover:bg-[#141414]"
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-full border border-white/20"
                    style={{
                      background: `radial-gradient(circle at 32% 30%, ${planet.accent}, ${planet.color} 62%, #000000 100%)`,
                    }}
                  />
                  <span className={`truncate text-[10px] ${selectedId === planet.id ? "text-white font-bold" : "text-neutral-400"}`}>
                    {planet.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* --------------------------------------------------------- side panel */}
          <div className="space-y-4">
            <Panel
              title={selected.name}
              subtitle={selected.designation === "Sol" ? "G-type main sequence star" : selected.type}
              actions={
                canTarget && destinationId !== selectedId ? (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Target size={12} />}
                    onClick={() => {
                      if (mission && isDestination(selectedId)) {
                        updateMission(mission.id, { destinationId: selectedId });
                      }
                      navigate("/planner");
                    }}
                  >
                    Target
                  </Button>
                ) : null
              }
            >
              <p className="text-[12px] leading-relaxed text-ink-muted">{selected.description}</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric label="Distance from Sun" value={num(selected.semiMajorAxisAU, 2)} unit="AU" size="sm" />
                <Metric label="Solar irradiance" value={num(selected.solarIrradianceWm2, selected.solarIrradianceWm2 < 10 ? 2 : 0)} unit="W/m²" size="sm" />
                <Metric label="Mean radius" value={num(selected.radiusKm, 0)} unit="km" size="sm" />
                <Metric label="Surface gravity" value={num(selected.surfaceGravityMS2, 2)} unit="m/s²" size="sm" />
                <Metric label="Orbital period" value={num(selected.orbitalPeriodDays / 365.25, 2)} unit="years" size="sm" />
                <Metric label="Day length" value={num(selected.rotationPeriodHours, 1)} unit="hours" size="sm" />
              </div>

              <div className="hairline mt-4 pt-3">
                <div className="label-tech mb-2">Physical data</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-6">
                  <DataRow label="Mass" value={`${selected.massKg.toExponential(3)} kg`} />
                  <DataRow label="Escape velocity" value={`${num(selected.escapeVelocityKms, 2)} km/s`} />
                  <DataRow label="Eccentricity" value={num(selected.eccentricity, 4)} />
                  <DataRow label="Inclination" value={`${num(selected.inclinationDeg, 2)}°`} />
                  <DataRow label="Axial tilt" value={`${num(selected.axialTiltDeg, 2)}°`} />
                  <DataRow label="Albedo" value={num(selected.albedo, 3)} />
                  <DataRow label="Mean temperature" value={`${num(selected.meanSurfaceTempC, 0)} °C`} />
                  <DataRow label="Moons" value={String(selected.moons)} />
                </div>
              </div>

              <div className="hairline mt-4 pt-3">
                <div className="label-tech mb-2">Noteworthy</div>
                <ul className="space-y-1.5">
                  {selected.facts.map((fact) => (
                    <li key={fact.label} className="flex items-baseline justify-between gap-3">
                      <span className="text-[11px] text-ink-muted">{fact.label}</span>
                      <span className="value-num text-[11px] text-ink">{fact.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>

            {profile ? (
              <Panel title="Environment and mission profile">
                <div className="mb-3 space-y-2.5">
                  {(
                    [
                      ["Radiation", selected.hazard.radiation],
                      ["Thermal", selected.hazard.thermal],
                      ["Dust", selected.hazard.dust],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label}>
                      <div className="mb-1 flex items-baseline justify-between">
                        <span className="label-tech">{label} hazard</span>
                        <span className="value-num text-[11px] text-ink-muted">{value}/100</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-line/70">
                        <div
                          className={`h-full ${
                            value > 70 ? "bg-danger" : value > 40 ? "bg-warning" : "bg-success"
                          }`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Metric label="Funding cap" value={`$${num(profile.budgetMillionUSD, 0)}M`} size="sm" />
                  <Metric label="Science window" value={profile.recommendedDurationMonths} unit="months" size="sm" />
                </div>

                <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">{profile.launchNote}</p>

                {selected.scienceObjectives.length > 0 ? (
                  <div className="hairline mt-3 pt-3">
                    <div className="label-tech mb-1.5 flex items-center gap-1.5">
                      <Zap size={11} /> Science objectives
                    </div>
                    <ul className="space-y-1">
                      {selected.scienceObjectives.map((objective) => (
                        <li key={objective} className="flex gap-2 text-[11px] leading-snug text-ink-muted">
                          <span className="text-accent">·</span>
                          {objective}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Panel>
            ) : null}

            <Panel title="Reference">
              <p className="text-[11px] leading-relaxed text-ink-muted">{selected.sourceNote}</p>
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  );
}
