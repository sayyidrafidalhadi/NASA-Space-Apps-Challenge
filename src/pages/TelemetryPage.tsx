import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, ArrowRight, Rocket } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { DataRow, Metric, StatusDot } from "@/components/ui/Metric";
import { EmptyState } from "@/components/ui/EmptyState";
import { PLANET_BY_ID } from "@/data/planets";
import { useMissionStore } from "@/store/missionStore";
import { useSimulationStore } from "@/store/simulationStore";
import { missionClock, num, percent } from "@/utils/format";

const AXIS = { stroke: "rgba(255, 255, 255, 0.15)", fontSize: 10, fontFamily: "IBM Plex Mono, monospace" };

/**
 * Mission Telemetry.
 *
 * Live flight data: the power balance, the battery state of charge, the
 * communications link and the accumulated science, plotted from the actual
 * simulation samples.
 */
export function TelemetryPage() {
  const navigate = useNavigate();
  const mission = useMissionStore((state) =>
    state.missions.find((item) => item.id === state.currentMissionId),
  );
  const runtime = useSimulationStore((state) => state.runtime);
  const running = useSimulationStore((state) => state.running);
  const toggle = useSimulationStore((state) => state.toggle);

  const samples = useMemo(() => runtime?.samples ?? [], [runtime?.samples]);

  const powerData = useMemo(
    () =>
      samples.map((sample) => ({
        day: Number(sample.day.toFixed(1)),
        generated: Number(sample.generatedW.toFixed(1)),
        load: Number(sample.loadW.toFixed(1)),
        battery: Number((sample.batteryFraction * 100).toFixed(1)),
      })),
    [samples],
  );

  const linkData = useMemo(
    () =>
      samples.map((sample) => ({
        day: Number(sample.day.toFixed(1)),
        link: Number((sample.commLink * 100).toFixed(1)),
        distance: Number(sample.distanceAu.toFixed(3)),
      })),
    [samples],
  );

  const scienceData = useMemo(
    () =>
      samples.map((sample) => ({
        day: Number(sample.day.toFixed(1)),
        science: Number(sample.science.toFixed(1)),
        health: Number(sample.health.toFixed(1)),
        fuel: Number(sample.fuelKg.toFixed(1)),
      })),
    [samples],
  );

  if (!mission) {
    return (
      <>
        <PageHeader eyebrow="TELEMETRY" title="Mission Telemetry" />
        <PageBody>
          <Panel>
            <EmptyState
              icon={<Rocket size={20} strokeWidth={1.4} />}
              title="No active mission"
              description="Telemetry appears once a mission has been configured."
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

  if (!runtime || samples.length === 0) {
    return (
      <>
        <PageHeader eyebrow="TELEMETRY" title="Mission Telemetry" />
        <PageBody>
          <Panel>
            <EmptyState
              icon={<Activity size={20} strokeWidth={1.4} />}
              title="No telemetry yet"
              description="Launch the mission to begin recording flight data. Every sample comes from the actual simulation."
              action={
                <Button variant="primary" icon={<Rocket size={13} />} onClick={() => navigate("/simulation")}>
                  Go to flight operations
                </Button>
              }
            />
          </Panel>
        </PageBody>
      </>
    );
  }

  const last = samples[samples.length - 1];

  return (
    <>
      <PageHeader
        eyebrow="TELEMETRY"
        title="Mission Telemetry"
        description={`${mission.name} · ${PLANET_BY_ID[mission.destinationId].name} · ${missionClock(runtime.elapsedDays)}`}
        actions={
          <>
            <Button size="sm" onClick={toggle} disabled={runtime.completed}>
              {running ? "Pause" : "Resume"}
            </Button>
            <Button size="sm" variant="primary" icon={<ArrowRight size={13} />} onClick={() => navigate("/evaluation")}>
              Mission evaluation
            </Button>
          </>
        }
      />

      <PageBody>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Metric
            label="Health"
            value={num(last.health, 0)}
            unit="%"
            size="sm"
            tone={last.health > 60 ? "success" : last.health > 30 ? "warning" : "danger"}
          />
          <Metric
            label="Battery"
            value={percent(last.batteryFraction * 100, 0)}
            size="sm"
            tone={last.batteryFraction > 0.35 ? "success" : "warning"}
          />
          <Metric
            label="Power balance"
            value={num(last.generatedW - last.loadW, 1)}
            unit="W"
            size="sm"
            tone={last.generatedW >= last.loadW ? "success" : "danger"}
          />
          <Metric label="Link" value={percent(last.commLink * 100, 0)} size="sm" tone={last.commLink > 0.4 ? "success" : "warning"} />
          <Metric label="Science" value={num(runtime.science, 1)} unit="pts" size="sm" tone="accent" />
          <Metric label="Propellant" value={num(last.fuelKg, 0)} unit="kg" size="sm" />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel title="Power generation and demand" subtitle="Watts, and the battery state of charge">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={powerData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="gen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="bat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00ff88" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="day" {...AXIS} tickFormatter={(value) => `${value}d`} />
                  <YAxis {...AXIS} />
                  <RechartsTooltip
                    contentStyle={{
                      background: "#0a0a0a",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: 2,
                      fontSize: 11,
                      fontFamily: "IBM Plex Mono, monospace",
                      boxShadow: "0 0 15px rgba(0,0,0,0.8)",
                    }}
                    labelFormatter={(value) => `Mission day ${value}`}
                  />
                  <Area type="monotone" dataKey="generated" name="Generated (W)" stroke="#ffffff" fill="url(#gen)" strokeWidth={1.8} />
                  <Area type="monotone" dataKey="load" name="Demand (W)" stroke="#ffb800" fill="transparent" strokeWidth={1.5} strokeDasharray="4 3" />
                  <Area type="monotone" dataKey="battery" name="Battery (%)" stroke="#00ff88" fill="url(#bat)" strokeWidth={1.8} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 font-mono text-[10px] text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-4 bg-white" /> Generation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-4 bg-[#ffb800]" /> Demand
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-4 bg-[#00ff88]" /> Battery %
              </span>
            </div>
          </Panel>

          <Panel title="Communications link" subtitle="Link margin against the range from Earth">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={linkData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="day" {...AXIS} tickFormatter={(value) => `${value}d`} />
                  <YAxis {...AXIS} />
                  <RechartsTooltip
                    contentStyle={{
                      background: "#111b28",
                      border: "1px solid #253548",
                      borderRadius: 3,
                      fontSize: 11,
                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  />
                  <Line type="monotone" dataKey="link" name="Link margin (%)" stroke="#77a9c9" strokeWidth={1.6} dot={false} />
                  <Line type="monotone" dataKey="distance" name="Range (AU)" stroke="#f0b86a" strokeWidth={1.2} dot={false} strokeDasharray="4 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Science return and spacecraft health">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scienceData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="#1a2534" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="day" {...AXIS} tickFormatter={(value) => `${value}d`} />
                  <YAxis {...AXIS} />
                  <RechartsTooltip
                    contentStyle={{
                      background: "#111b28",
                      border: "1px solid #253548",
                      borderRadius: 3,
                      fontSize: 11,
                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  />
                  <Line type="monotone" dataKey="science" name="Science (pts)" stroke="#83c9f2" strokeWidth={1.6} dot={false} />
                  <Line type="monotone" dataKey="health" name="Health (%)" stroke="#53d6a0" strokeWidth={1.6} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Propellant remaining" subtitle="Kilograms of usable propellant on board">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scienceData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="fuel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f0b86a" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f0b86a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1a2534" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="day" {...AXIS} tickFormatter={(value) => `${value}d`} />
                  <YAxis {...AXIS} />
                  <RechartsTooltip
                    contentStyle={{
                      background: "#111b28",
                      border: "1px solid #253548",
                      borderRadius: 3,
                      fontSize: 11,
                      fontFamily: "IBM Plex Mono, monospace",
                    }}
                  />
                  <Area type="monotone" dataKey="fuel" name="Propellant (kg)" stroke="#f0b86a" fill="url(#fuel)" strokeWidth={1.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Subsystem status" className="xl:col-span-2">
            <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="label-tech mb-1">Power system</div>
                <DataRow label="Generation" value={`${num(last.generatedW, 1)} W`} />
                <DataRow label="Demand" value={`${num(last.loadW, 1)} W`} />
                <DataRow
                  label="Margin"
                  value={`${num(last.generatedW - last.loadW, 1)} W`}
                  tone={last.generatedW >= last.loadW ? "success" : "danger"}
                />
                <DataRow label="Deficit days" value={num(runtime.powerDeficitDays, 1)} />
              </div>
              <div>
                <div className="label-tech mb-1">Energy storage</div>
                <DataRow label="State of charge" value={percent(last.batteryFraction * 100, 1)} />
                <DataRow label="Stored energy" value={`${num(last.batteryWh / 1000, 2)} kWh`} />
                <DataRow label="Capacity" value={`${num(runtime.batteryCapacityWh / 1000, 2)} kWh`} />
                <DataRow
                  label="Data lost"
                  value={`${num(runtime.dataLostGbit, 1)} Gbit`}
                  tone={runtime.dataLostGbit > 0 ? "warning" : "default"}
                />
              </div>
              <div>
                <div className="label-tech mb-1">Vehicle status</div>
                <DataRow label="Health" value={`${num(last.health, 0)}%`} />
                <DataRow label="Electronics" value={`${num(last.thermalC, 0)} °C`} />
                <DataRow label="Propellant" value={`${num(last.fuelKg, 0)} kg`} />
                <DataRow label="Range" value={`${num(last.distanceAu, 3)} AU`} />
              </div>
            </div>
            <div className="hairline mt-4 flex items-center justify-between pt-3">
              <StatusDot
                tone={runtime.completed ? (runtime.outcome === "failure" ? "danger" : "success") : running ? "success" : "default"}
                pulse={running}
                label={
                  runtime.completed
                    ? runtime.outcome === "failure"
                      ? "MISSION FAILED"
                      : "MISSION COMPLETE"
                    : running
                      ? "TELEMETRY LIVE"
                      : "TELEMETRY PAUSED"
                }
              />
              <span className="value-num text-[11px] text-ink-muted">
                {samples.length} samples · 0.25 day resolution
              </span>
            </div>
          </Panel>
        </div>
      </PageBody>
    </>
  );
}
