import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Download, FileText, Printer, Rocket, ScrollText, TriangleAlert } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { DataRow, Metric, StatusDot } from "@/components/ui/Metric";
import { EmptyState } from "@/components/ui/EmptyState";
import { buildMissionReport } from "@/engine/missionScoring";
import { useMissionStore } from "@/store/missionStore";
import { useSimulationStore } from "@/store/simulationStore";
import { money, num, percent } from "@/utils/format";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { HudCorners } from "@/components/ui/HudBracket";
import { sound } from "@/utils/sound";

/**
 * Mission Evaluation.
 *
 * The final report: outcome, weighted score, objective performance, failures
 * and recoveries, and recommendations. Every figure is computed from the
 * flown mission state. The report can be exported as JSON or printed.
 */
export function EvaluationPage() {
  const navigate = useNavigate();
  const mission = useMissionStore((state) =>
    state.missions.find((item) => item.id === state.currentMissionId),
  );
  const reports = useMissionStore((state) => state.reports);
  const saveReport = useMissionStore((state) => state.saveReport);
  const runtime = useSimulationStore((state) => state.runtime);
  const config = useSimulationStore((state) => state.config);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  const liveReport = useMemo(() => {
    if (!runtime || !config || !mission) return null;
    if (runtime.missionId !== mission.id) return null;
    return buildMissionReport({
      runtime,
      config,
      budgetCapMillionUSD: mission.budgetMillionUSD,
    });
  }, [runtime, config, mission]);

  const archived = useMemo(() => {
    if (selectedReportId) return reports.find((item) => item.generatedAt === selectedReportId) ?? null;
    return liveReport ?? reports[0] ?? null;
  }, [selectedReportId, reports, liveReport]);

  if (!mission && reports.length === 0) {
    return (
      <>
        <PageHeader eyebrow="EVALUATION" title="Mission Evaluation" />
        <PageBody>
          <Panel>
            <EmptyState
              icon={<ScrollText size={20} strokeWidth={1.4} />}
              title="No missions to evaluate"
              description="Fly a mission and its report will be generated here."
              action={
                <Button variant="primary" onClick={() => navigate("/planner")}>
                  Start a mission
                </Button>
              }
            />
          </Panel>
        </PageBody>
      </>
    );
  }

  const exportJson = () => {
    if (!archived) return;
    sound.snap();
    const blob = new Blob([JSON.stringify(archived, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${archived.missionName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-report.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        eyebrow="EVALUATION"
        title="Mission Evaluation"
        description="A weighted assessment of the flown mission. Every ratio is calculated from the actual mission state."
        actions={
          <>
            <Button size="sm" icon={<Download size={13} />} onClick={exportJson} disabled={!archived}>
              Export JSON
            </Button>
            <Button size="sm" icon={<Printer size={13} />} onClick={() => window.print()} disabled={!archived}>
              Print report
            </Button>
            {liveReport ? (
              <Button
                size="sm"
                variant="primary"
                icon={<FileText size={13} />}
                onClick={() => saveReport(liveReport)}
              >
                Archive report
              </Button>
            ) : null}
          </>
        }
      />

      <PageBody>
        {!archived ? (
          <Panel>
            <EmptyState
              icon={<Rocket size={20} strokeWidth={1.4} />}
              title="No completed flight yet"
              description="The evaluation report is generated once the mission has been flown."
              action={
                <Button variant="primary" onClick={() => navigate("/simulation")}>
                  Go to flight operations
                </Button>
              }
            />
          </Panel>
        ) : (
          <div className="space-y-4">
            {/* -------------------------------------------------- outcome banner */}
            <Panel
              title={archived.outcomeTitle}
              subtitle={archived.outcomeSummary}
              beam={archived.outcome === "success"}
              actions={
                <StatusDot
                  tone={archived.outcome === "success" ? "success" : archived.outcome === "partial" ? "warning" : "danger"}
                  label={archived.outcome.toUpperCase()}
                  pulse={archived.outcome === "success"}
                />
              }
            >
              <div className="grid grid-cols-2 gap-6 lg:grid-cols-5">
                <div className="col-span-2 flex items-center gap-4">
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center border border-white/30 bg-neutral-950 font-mono shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                    <HudCorners />
                    <span className="value-num text-[32px] font-black leading-none text-white">
                      <NumberTicker value={archived.score} />
                    </span>
                  </div>
                  <div>
                    <div className="label-tech text-neutral-400">Final score</div>
                    <div className="value-num text-[11px] text-neutral-400">out of {archived.scoreMax}</div>
                    <div className="mt-1.5 flex items-center gap-1.5 font-mono">
                      <Award size={13} className="text-[#ffb800]" />
                      <span className="text-[11px] font-medium text-white">
                        {archived.score >= 80
                          ? "Mission director's commendation"
                          : archived.score >= 60
                            ? "Successful mission with reservations"
                            : archived.score >= 40
                              ? "Marginal mission"
                              : "Mission failure review required"}
                      </span>
                    </div>
                  </div>
                </div>

                <Metric label="Mission" value={archived.missionName} size="sm" />
                <Metric label="Destination" value={archived.destinationName} size="sm" />
                <Metric
                  label="Flown"
                  value={num(archived.daysFlown, 0)}
                  unit="days"
                  size="sm"
                  detail={`${num(archived.monthsFlown, 1)} months`}
                />
              </div>
            </Panel>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="space-y-4">
                {/* ----------------------------------------------- score breakdown */}
                <Panel title="Score breakdown" subtitle="Weighted performance by category">
                  <ul className="space-y-3">
                    {archived.categories.map((category) => (
                      <li key={category.id}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-[12px] text-ink">{category.label}</span>
                          <span className="value-num text-[12px] text-ink">
                            {num(category.ratio * 100, 0)}%{" "}
                            <span className="text-ink-muted">
                              × {num(category.weight * 100, 0)}% = {num(category.ratio * category.weight * 100, 1)}
                            </span>
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line/70">
                          <div
                            className={`h-full ${
                              category.ratio >= 0.75
                                ? "bg-success"
                                : category.ratio >= 0.45
                                  ? "bg-accent"
                                  : "bg-warning"
                            }`}
                            style={{ width: `${category.ratio * 100}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-ink-muted">{category.detail}</p>
                      </li>
                    ))}
                  </ul>
                </Panel>

                {/* -------------------------------------------------- objectives */}
                <Panel title="Scientific objectives" subtitle="Completion against the planned objectives">
                  <ul className="space-y-3">
                    {archived.objectives.map((objective) => (
                      <li key={objective.objectiveId}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-[12px] text-ink">{objective.title}</span>
                          <span
                            className={`value-num text-[11px] ${objective.complete ? "text-success" : "text-warning"}`}
                          >
                            {objective.complete ? "COMPLETE" : "INCOMPLETE"} · {percent(objective.progress * 100, 0)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-line/70">
                          <div
                            className={`h-full ${objective.complete ? "bg-success" : "bg-warning"}`}
                            style={{ width: `${Math.min(100, objective.progress * 100)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="hairline mt-4 pt-3">
                    <DataRow
                      label="Science achieved"
                      value={`${num(archived.scienceAchieved, 0)} of ${num(archived.scienceTarget, 0)} points`}
                    />
                  </div>
                </Panel>

                {/* ------------------------------------------- failures and recovery */}
                <Panel title="Failures and recovery decisions">
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div>
                      <div className="label-tech mb-2 flex items-center gap-1.5">
                        <TriangleAlert size={11} className="text-danger" /> Adverse events (
                        {archived.failures.length})
                      </div>
                      {archived.failures.length === 0 ? (
                        <p className="text-[11px] text-ink-muted">No event turned against the mission.</p>
                      ) : (
                        <ul className="space-y-2">
                          {archived.failures.map((failure) => (
                            <li key={failure.id} className="border-l-2 border-danger/60 pl-2.5">
                              <div className="text-[12px] font-medium text-ink">{failure.title}</div>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{failure.detail}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <div className="label-tech mb-2">Successful decisions ({archived.recoveries.length})</div>
                      {archived.recoveries.length === 0 ? (
                        <p className="text-[11px] text-ink-muted">No decisions were recorded.</p>
                      ) : (
                        <ul className="space-y-2">
                          {archived.recoveries.map((recovery) => (
                            <li key={`${recovery.id}-${recovery.title}`} className="border-l-2 border-success/60 pl-2.5">
                              <div className="text-[12px] font-medium text-ink">{recovery.title}</div>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{recovery.detail}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </Panel>

                {/* ------------------------------------------------- event history */}
                <Panel title="Mission timeline summary">
                  <ul className="space-y-2">
                    {archived.events.map((event) => (
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
                </Panel>
              </div>

              {/* ------------------------------------------------------ side rail */}
              <div className="space-y-4">
                <Panel title="Resource performance">
                  <div className="grid grid-cols-2 gap-4">
                    <Metric
                      label="Budget spent"
                      value={money(archived.budgetSpentMillionUSD)}
                      size="sm"
                      detail={`of ${money(archived.budgetCapMillionUSD, 0)}`}
                      tone={
                        archived.budgetSpentMillionUSD > archived.budgetCapMillionUSD ? "danger" : "default"
                      }
                    />
                    <Metric
                      label="Efficiency"
                      value={percent((1 - archived.budgetEfficiency) * 100, 0)}
                      size="sm"
                      tone={archived.budgetEfficiency > 0.92 ? "warning" : "success"}
                    />
                    <Metric label="Spacecraft mass" value={num(archived.massKg, 0)} unit="kg" size="sm" />
                    <Metric label="Δv committed" value={num(archived.deltaVKms, 2)} unit="km/s" size="sm" />
                    <Metric
                      label="Propellant used"
                      value={num(archived.fuelUsedKg, 0)}
                      unit="kg"
                      size="sm"
                    />
                    <Metric
                      label="Propellant left"
                      value={num(archived.fuelRemainingKg, 0)}
                      unit="kg"
                      size="sm"
                    />
                  </div>
                </Panel>

                <Panel title="Recommendations">
                  <ul className="space-y-3">
                    {archived.recommendations.map((recommendation) => (
                      <li key={recommendation.title} className="border-l-2 border-accent/60 pl-2.5">
                        <div className="text-[12px] font-medium text-ink">{recommendation.title}</div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{recommendation.detail}</p>
                      </li>
                    ))}
                  </ul>
                </Panel>

                <Panel title="Simulation assumptions">
                  <ul className="space-y-1.5">
                    {archived.assumptions.map((assumption) => (
                      <li key={assumption} className="flex gap-2 text-[11px] leading-relaxed text-ink-muted">
                        <span className="text-accent-soft">·</span>
                        {assumption}
                      </li>
                    ))}
                  </ul>
                </Panel>

                {reports.length > 0 ? (
                  <Panel title="Archive">
                    <ul className="space-y-1">
                      {reports.map((item) => (
                        <li key={`${item.missionId}-${item.generatedAt}`}>
                          <button
                            type="button"
                            onClick={() => setSelectedReportId(item.generatedAt)}
                            className="flex w-full items-center justify-between gap-3 border border-line bg-abyss/50 px-3 py-2 text-left transition-colors hover:border-accent-soft/50"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-[12px] text-ink">{item.missionName}</span>
                              <span className="value-num block text-[10px] text-ink-muted">
                                {item.destinationName} · {new Date(item.generatedAt).toLocaleDateString()}
                              </span>
                            </span>
                            <span className="value-num text-[13px] text-accent">{item.score}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    {liveReport ? (
                      <Button
                        className="mt-3 w-full"
                        size="sm"
                        onClick={() => setSelectedReportId(null)}
                      >
                        Show the current flight
                      </Button>
                    ) : null}
                  </Panel>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </PageBody>
    </>
  );
}
