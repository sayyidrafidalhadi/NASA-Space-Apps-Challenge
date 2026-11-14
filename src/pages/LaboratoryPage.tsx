import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { DataRow, Metric, Meter, StatusDot } from "@/components/ui/Metric";
import { Tooltip } from "@/components/ui/Tooltip";
import { EmptyState } from "@/components/ui/EmptyState";
import { SceneCanvas } from "@/three/SceneCanvas";
import { Spacecraft3D } from "@/three/Spacecraft3D";
import { CATEGORY_LABELS, CATEGORY_ORDER, COMPONENTS_BY_CATEGORY } from "@/data/spacecraftComponents";
import { useMissionStore } from "@/store/missionStore";
import { useSpacecraftStore } from "@/store/spacecraftStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useActiveBuild, useEngineeringReport } from "@/hooks/useEngineering";
import type { ComponentCategory, ComponentSpec } from "@/types";
import { money, num, percent, velocity } from "@/utils/format";
import { sound } from "@/utils/sound";

/**
 * Spacecraft Laboratory.
 *
 * The interactive configurator: choose a subsystem, watch the 3D model and
 * every engineering constraint update in the same instant.
 */
export function LaboratoryPage() {
  const navigate = useNavigate();
  const mission = useMissionStore((state) =>
    state.missions.find((item) => item.id === state.currentMissionId),
  );
  const updateMission = useMissionStore((state) => state.updateMission);
  const setComponent = useSpacecraftStore((state) => state.setComponent);
  const toggleInstrument = useSpacecraftStore((state) => state.toggleInstrument);
  const resetBuild = useSpacecraftStore((state) => state.resetBuild);
  const settings = useSettingsStore();

  const build = useActiveBuild();
  const report = useEngineeringReport();
  const [category, setCategory] = useState<ComponentCategory>("bus");
  const [detailId, setDetailId] = useState<string | null>(null);

  const components = COMPONENTS_BY_CATEGORY[category];
  const selectedIds = useMemo(() => {
    switch (category) {
      case "bus":
        return [build.busId];
      case "power":
        return [build.powerId];
      case "thermal":
        return [build.thermalId];
      case "propulsion":
        return [build.propulsionId];
      case "fuel":
        return [build.fuelId];
      case "comms":
        return [build.commsId];
      case "battery":
        return [build.batteryId];
      default:
        return build.instrumentIds;
    }
  }, [category, build]);

  const detail: ComponentSpec | null = useMemo(() => {
    const pool = category === "instrument" ? COMPONENTS_BY_CATEGORY.instrument : COMPONENTS_BY_CATEGORY[category];
    const id = detailId ?? selectedIds[0];
    return pool.find((item) => item.id === id) ?? null;
  }, [category, detailId, selectedIds]);

  if (!mission) {
    return (
      <>
        <PageHeader eyebrow="SPACECRAFT" title="Spacecraft Laboratory" />
        <PageBody>
          <Panel>
            <EmptyState
              title="No active mission"
              description="A mission defines the destination and the budget that the spacecraft is designed against."
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

  const select = (component: ComponentSpec) => {
    sound.click(1500, 0.015);
    setDetailId(component.id);
    if (category === "instrument") {
      toggleInstrument(mission.id, component.id);
    } else {
      setComponent(mission.id, category, component.id);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="SPACECRAFT CONFIGURATION"
        title="Spacecraft Laboratory"
        description="Assemble the spacecraft subsystem by subsystem. Every change updates the model, the mass, the power budget and the launch gate immediately."
        actions={
          <>
            <Button size="sm" icon={<RotateCcw size={13} />} onClick={() => resetBuild(mission.id)}>
              Reset build
            </Button>
            <Button variant="primary" icon={<ArrowRight size={13} />} onClick={() => navigate("/launch")}>
              Choose a launch vehicle
            </Button>
          </>
        }
      />

      <PageBody>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)_330px]">
          {/* ------------------------------------------------- component picker */}
          <div className="space-y-3">
            <Panel title="Subsystems" dense>
              <nav className="grid grid-cols-2 gap-px bg-line/40 p-px">
                {CATEGORY_ORDER.map((item) => {
                  const active = category === item;
                  const count =
                    item === "instrument"
                      ? build.instrumentIds.length
                      : 1;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        sound.click(1800, 0.008);
                        setCategory(item);
                        setDetailId(null);
                      }}
                      className={`flex items-center justify-between gap-2 px-2.5 py-2 font-mono text-left text-[11px] transition-all ${
                        active
                          ? "bg-white text-black font-bold shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                          : "bg-[#0c0c0c] text-neutral-400 hover:bg-[#161616] hover:text-white"
                      }`}
                    >
                      <span className="truncate">{CATEGORY_LABELS[item]}</span>
                      {item === "instrument" ? (
                        <span className={`value-num text-[10px] ${active ? "text-black" : "text-white"}`}>{count}</span>
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </Panel>

            <Panel title={CATEGORY_LABELS[category]} dense>
              <ul className="divide-y divide-white/5 font-mono">
                {components.map((component) => {
                  const spec = report?.parts;
                  const active =
                    component.id === spec?.bus.id ||
                    component.id === spec?.power.id ||
                    component.id === spec?.thermal.id ||
                    component.id === spec?.propulsion.id ||
                    component.id === spec?.fuel.id ||
                    component.id === spec?.comms.id ||
                    component.id === spec?.battery.id ||
                    spec?.instruments.some((item) => item.id === component.id);
                  return (
                    <li key={component.id}>
                      <button
                        type="button"
                        onClick={() => select(component)}
                        onMouseEnter={() => setDetailId(component.id)}
                        className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-all ${
                          active
                            ? "bg-white/10 border-l-2 border-white text-white"
                            : "hover:bg-[#141414] text-neutral-300"
                        }`}
                      >
                        <span className="mt-0.5 shrink-0">
                          {active ? (
                            <CheckCircle2 size={14} className="text-white" />
                          ) : (
                            <span className="block h-[14px] w-[14px] border border-white/20" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-medium text-white">{component.name}</span>
                          <span className="value-num mt-0.5 block text-[10px] text-neutral-400">
                            {num(component.massKg, 0)} kg · {money(component.costMillionUSD, 0)}
                            {component.powerGenerationW > 0
                              ? ` · ${num(component.powerGenerationW, 0)} W`
                              : component.powerLoadW > 0
                                ? ` · ${num(component.powerLoadW, 0)} W`
                                : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>

          {/* -------------------------------------------------------- 3D model */}
          <div className="space-y-3">
            <div className="panel overflow-hidden">
              <SceneCanvas
                quality={settings.graphicsQuality}
                cameraPosition={[3.4, 2.4, 4.6]}
                cameraFov={38}
                className="h-[380px] w-full lg:h-[460px]"
              >
                <Spacecraft3D config={build} quality={settings.graphicsQuality} />
                <ambientLight intensity={0.5} color="#9fb6d0" />
                <directionalLight position={[4, 6, 4]} intensity={2.1} color="#fff4e0" />
                <directionalLight position={[-5, -2, -3]} intensity={0.55} color="#4f6f96" />
                <pointLight position={[0, 0, 0]} intensity={1.2} color="#83c9f2" distance={12} />
              </SceneCanvas>
              <div className="flex items-center justify-between border-t border-line px-3 py-2">
                <span className="label-tech">Live configuration model</span>
                <span className="value-num text-[10px] text-ink-muted">
                  {num(report?.totalMassKg ?? 0, 0)} kg wet · {num(report?.dryMassKg ?? 0, 0)} kg dry
                </span>
              </div>
            </div>

            {detail ? (
              <Panel title={detail.name} subtitle={detail.source}>
                <p className="text-[12px] leading-relaxed text-ink-muted">{detail.description}</p>

                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-0 sm:grid-cols-3">
                  {detail.specs.map((spec) => (
                    <DataRow key={spec.label} label={spec.label} value={spec.value} />
                  ))}
                  <DataRow label="Mass" value={`${num(detail.massKg, 1)} kg`} />
                  <DataRow label="Cost" value={money(detail.costMillionUSD, 1)} />
                  {detail.powerGenerationW > 0 ? (
                    <DataRow label="Generation at 1 AU" value={`${num(detail.powerGenerationW, 0)} W`} tone="success" />
                  ) : null}
                  {detail.powerLoadW > 0 ? (
                    <DataRow label="Electrical load" value={`${num(detail.powerLoadW, 0)} W`} />
                  ) : null}
                  {detail.ispSeconds ? (
                    <DataRow label="Specific impulse" value={`${num(detail.ispSeconds, 0)} s`} />
                  ) : null}
                  {detail.propellantCapacityKg ? (
                    <DataRow label="Propellant" value={`${num(detail.propellantCapacityKg, 0)} kg`} />
                  ) : null}
                  {detail.capacityWh ? (
                    <DataRow label="Energy storage" value={`${num(detail.capacityWh, 0)} Wh`} />
                  ) : null}
                  {detail.dataRateMbps ? (
                    <DataRow label="Data rate" value={`${num(detail.dataRateMbps * 1000, 1)} kbps`} />
                  ) : null}
                  {detail.scienceWeight ? (
                    <DataRow label="Science weight" value={num(detail.scienceWeight, 1)} />
                  ) : null}
                </div>

                {detail.constraints.length > 0 ? (
                  <div className="hairline mt-3 pt-3">
                    <div className="label-tech mb-1.5">Constraints</div>
                    <ul className="space-y-1">
                      {detail.constraints.map((constraint) => (
                        <li key={constraint} className="flex gap-2 text-[11px] leading-snug text-ink-muted">
                          <AlertTriangle size={11} className="mt-0.5 shrink-0 text-warning" />
                          {constraint}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Panel>
            ) : null}
          </div>

          {/* ------------------------------------------------------- telemetry */}
          <div className="space-y-3">
            {report ? (
              <>
                <Panel title="Engineering summary">
                  <div className="grid grid-cols-2 gap-4">
                    <Metric
                      label="Launch mass"
                      value={num(report.launchMassKg, 0)}
                      unit="kg"
                      size="sm"
                      detail={`${num(report.totalMassKg, 0)} kg wet + ${num(report.launchMassKg - report.totalMassKg, 0)} kg margin`}
                    />
                    <Metric
                      label="Total cost"
                      value={money(report.totalCostMillionUSD)}
                      size="sm"
                      detail={`${money(report.componentCostMillionUSD)} spacecraft + ${money(report.launchCostMillionUSD)} launch`}
                    />
                  </div>

                  <div className="hairline mt-3 space-y-3 pt-3">
                    <Meter
                      label="Mass margin"
                      value={report.massMarginPct ?? 0}
                      tone={
                        report.massMarginPct === null
                          ? "default"
                          : report.massMarginPct < 0
                            ? "danger"
                            : report.massMarginPct < 8
                              ? "warning"
                              : "success"
                      }
                    />
                    <Meter
                      label="Budget used"
                      value={(report.totalCostMillionUSD / Math.max(1, report.budgetCapMillionUSD)) * 100}
                      tone={
                        report.totalCostMillionUSD > report.budgetCapMillionUSD
                          ? "danger"
                          : report.budgetRemainingMillionUSD / report.budgetCapMillionUSD < 0.1
                            ? "warning"
                            : "success"
                      }
                    />
                    <Meter
                      label="Power margin"
                      value={Math.max(0, report.power.marginPct)}
                      tone={report.power.deficit ? "danger" : report.power.marginPct < 12 ? "warning" : "success"}
                    />
                  </div>
                </Panel>

                <Panel title="Power system">
                  <div className="grid grid-cols-2 gap-4">
                    <Metric
                      label="Generation"
                      value={num(report.power.generatedW, 1)}
                      unit="W"
                      size="sm"
                      tone={report.power.deficit ? "danger" : "success"}
                    />
                    <Metric label="Average load" value={num(report.power.averageLoadW, 1)} unit="W" size="sm" />
                    <Metric
                      label="Peak load"
                      value={num(report.power.peakLoadW, 1)}
                      unit="W"
                      size="sm"
                    />
                    <Metric
                      label="Net power"
                      value={num(report.power.netPowerW, 1)}
                      unit="W"
                      size="sm"
                      tone={report.power.netPowerW < 0 ? "danger" : "success"}
                    />
                  </div>
                  <div className="hairline mt-3 pt-3">
                    <DataRow
                      label="Solar flux at target"
                      value={
                        report.power.generatedAt1AUW > 0
                          ? `${percent(report.power.solarFraction * 100, 1)} of 1 AU`
                          : "Constant output"
                      }
                    />
                    <DataRow label="Instrument load" value={`${num(report.power.instrumentLoadW, 1)} W`} />
                    <DataRow label="Comms load" value={`${num(report.power.commsLoadW, 1)} W`} />
                    <DataRow
                      label="Usable battery"
                      value={`${num(report.power.usableBatteryKWh, 2)} kWh`}
                    />
                  </div>
                </Panel>

                <Panel title="Propulsion and thermal">
                  <div className="grid grid-cols-2 gap-4">
                    <Metric
                      label="Δv available"
                      value={num(report.propulsion.remainingDeltaVMs / 1000, 2)}
                      unit="km/s"
                      size="sm"
                      tone={report.deltaVShortfallMs > 0 ? "danger" : "success"}
                    />
                    <Metric
                      label="Δv required"
                      value={num(report.deltaV.spacecraftDeltaVKms, 2)}
                      unit="km/s"
                      size="sm"
                      detail="insertion, capture, correction"
                    />
                  </div>
                  <div className="hairline mt-3 pt-3">
                    <DataRow label="Specific impulse" value={`${num(report.propulsion.ispSeconds, 0)} s`} />
                    <DataRow label="Propellant loaded" value={`${num(report.propulsion.propellantKg, 0)} kg`} />
                    <DataRow
                      label="Radiator"
                      value={`${num(report.thermal.radiatorTemperatureC, 0)} °C`}
                      tone={report.thermal.excessHeatW > 0 ? "danger" : "default"}
                    />
                    <DataRow label="Heat load" value={`${num(report.thermal.totalHeatW, 0)} W`} />
                    <DataRow
                      label="Link at target"
                      value={`${num(report.communication.effectiveMbps * 1000, 1)} kbps`}
                      tone={
                        report.communication.status === "critical"
                          ? "danger"
                          : report.communication.status === "marginal"
                            ? "warning"
                            : "default"
                      }
                    />
                    <DataRow label="Light time" value={`${num(report.communication.lightTimeS / 60, 1)} min`} />
                  </div>
                </Panel>

                <Panel
                  title="Launch gate"
                  actions={
                    <StatusDot
                      tone={report.readyToLaunch ? "success" : "danger"}
                      pulse={!report.readyToLaunch}
                      label={report.readyToLaunch ? "CLEAR" : `${report.blockingCount} BLOCKING`}
                    />
                  }
                >
                  {report.constraints.length === 0 ? (
                    <div className="flex items-center gap-2 text-[11px] text-success">
                      <CheckCircle2 size={13} /> All engineering constraints satisfied.
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {report.constraints.map((constraint) => (
                        <li key={constraint.id} className="border-l-2 border-line pl-2.5">
                          <div className="flex items-center gap-2">
                            {constraint.severity === "blocking" ? (
                              <XCircle size={12} className="shrink-0 text-danger" />
                            ) : (
                              <AlertTriangle size={12} className="shrink-0 text-warning" />
                            )}
                            <span className="text-[12px] font-medium text-ink">{constraint.title}</span>
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{constraint.detail}</p>
                          <p className="value-num mt-1 text-[10px] text-accent-soft/80">{constraint.formula}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>

                <Panel title="Payload coverage">
                  {report.objectives.map((capability) => (
                    <div key={capability.objective.id} className="border-b border-line py-2 last:border-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[12px] text-ink">{capability.objective.title}</span>
                        <span className="value-num text-[11px] text-ink-muted">
                          {capability.matchedInstruments.length > 0
                            ? `${capability.matchedInstruments.length} instrument${capability.matchedInstruments.length === 1 ? "" : "s"}`
                            : "no match"}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <Meter
                          value={capability.potential * 100}
                          tone={capability.potential >= 0.6 ? "success" : capability.potential > 0 ? "warning" : "danger"}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-ink-muted">
                        {capability.matchedInstruments.length > 0
                          ? capability.matchedInstruments.map((item) => item.shortName).join(", ")
                          : `Needs: ${capability.objective.instrumentCategories.join(", ")}`}
                      </p>
                    </div>
                  ))}
                </Panel>

                <Panel title="What the numbers mean">
                  <ul className="space-y-2 text-[11px] leading-relaxed text-ink-muted">
                    <li className="flex gap-2">
                      <Info size={12} className="mt-0.5 shrink-0 text-accent" />
                      <span>
                        <Tooltip content="The mass the launcher must lift: dry spacecraft plus propellant plus the structural, harness and thermal margin.">
                          <span className="text-ink">Launch mass</span>
                        </Tooltip>{" "}
                        includes the {num((report.launchMassKg - report.totalMassKg), 0)} kg structural margin applied to
                        every build.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <Info size={12} className="mt-0.5 shrink-0 text-accent" />
                      <span>
                        <Tooltip content="Δv = Isp × g₀ × ln(m₀/mf). An ideal impulsive burn with no gravity or drag losses — real budgets run 10–30% higher.">
                          <span className="text-ink">Available Δv</span>
                        </Tooltip>{" "}
                        comes from the Tsiolkovsky equation applied to the selected tank and engine.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <Info size={12} className="mt-0.5 shrink-0 text-accent" />
                      <span>
                        <Tooltip content="Free-space path loss grows with the square of range, so an array quoted at 5.2 AU loses most of its output at 1 AU.">
                          <span className="text-ink">Link at target</span>
                        </Tooltip>{" "}
                        is the downlink rate left after inverse-square path loss at the destination's distance.
                      </span>
                    </li>
                  </ul>
                  <Button
                    className="mt-3 w-full"
                    variant="primary"
                    onClick={() => {
                      updateMission(mission.id, { status: "configured" });
                      navigate("/launch");
                    }}
                    icon={<ArrowRight size={13} />}
                  >
                    Continue to launch vehicle
                  </Button>
                  <p className="mt-2 text-center text-[10px] text-ink-muted">
                    Spacecraft Δv {velocity(report.deltaV.spacecraftDeltaVKms * 1000)} ·{" "}
                    {report.deltaVShortfallMs > 0
                      ? `short by ${num(report.deltaVShortfallMs / 1000, 2)} km/s`
                      : "propellant sufficient"}
                  </p>
                </Panel>
              </>
            ) : null}
          </div>
        </div>
      </PageBody>
    </>
  );
}
