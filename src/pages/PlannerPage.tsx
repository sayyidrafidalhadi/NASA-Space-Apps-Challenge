import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Check, CircleCheck, FlaskConical } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { DataRow, Metric, StatusDot } from "@/components/ui/Metric";
import { DESTINATION_PLANETS, PLANET_BY_ID } from "@/data/planets";
import { DESTINATION_PROFILES, objectivesFor } from "@/data/missionObjectives";
import { useMissionStore } from "@/store/missionStore";
import { useEngineeringReport } from "@/hooks/useEngineering";
import { money, num } from "@/utils/format";
import type { DestinationId } from "@/types";

/**
 * Mission Planner.
 *
 * A guided workflow: name the mission, choose the destination, pick the
 * scientific objectives, set the science window and confirm the budget.
 */
export function PlannerPage() {
  const navigate = useNavigate();
  const missions = useMissionStore((state) => state.missions);
  const currentMissionId = useMissionStore((state) => state.currentMissionId);
  const createMission = useMissionStore((state) => state.createMission);
  const updateMission = useMissionStore((state) => state.updateMission);
  const report = useEngineeringReport();

  const existing = missions.find((item) => item.id === currentMissionId) ?? null;

  const [name, setName] = useState(existing?.name ?? "");
  const [destinationId, setDestinationId] = useState<DestinationId>(existing?.destinationId ?? "mars");
  const [objectiveIds, setObjectiveIds] = useState<string[]>(
    existing?.objectiveIds ?? objectivesFor(existing?.destinationId ?? "mars").slice(0, 2).map((o) => o.id),
  );
  const [durationMonths, setDurationMonths] = useState(
    existing?.durationMonths ?? DESTINATION_PROFILES[existing?.destinationId ?? "mars"].minDurationMonths,
  );
  const [budget, setBudget] = useState(
    existing?.budgetMillionUSD ?? DESTINATION_PROFILES[existing?.destinationId ?? "mars"].budgetMillionUSD,
  );
  const [touched, setTouched] = useState(false);

  const profile = DESTINATION_PROFILES[destinationId];
  const objectives = useMemo(() => objectivesFor(destinationId), [destinationId]);

  const handleSelectDestination = (newId: DestinationId) => {
    setDestinationId(newId);
    const newProfile = DESTINATION_PROFILES[newId];
    const next = objectivesFor(newId);
    setObjectiveIds((current) => {
      const valid = current.filter((id) => next.some((objective) => objective.id === id));
      return valid.length > 0 ? valid : next.slice(0, 2).map((objective) => objective.id);
    });
    setDurationMonths((current) =>
      Math.min(Math.max(current, newProfile.minDurationMonths), newProfile.maxDurationMonths),
    );
    setBudget(newProfile.budgetMillionUSD);
  };

  const missionName = name.trim() || `${PLANET_BY_ID[destinationId].name} Mission`;

  const issues: string[] = [];
  if (objectiveIds.length === 0) issues.push("Select at least one scientific objective.");
  if (durationMonths < profile.minDurationMonths) {
    issues.push(`The science window must be at least ${profile.minDurationMonths} months for this destination.`);
  }
  if (durationMonths > profile.maxDurationMonths) {
    issues.push(`The science window cannot exceed ${profile.maxDurationMonths} months for this destination.`);
  }
  if (budget < 100) issues.push("The funding cap must be at least $100M.");

  const save = () => {
    setTouched(true);
    if (issues.length > 0) return;
    if (existing) {
      updateMission(existing.id, {
        name: missionName,
        destinationId,
        objectiveIds,
        durationMonths,
        budgetMillionUSD: budget,
        status: "configured",
      });
    } else {
      createMission({
        name: missionName,
        destinationId,
        objectiveIds,
        durationMonths,
        budgetMillionUSD: budget,
        status: "configured",
      });
    }
  };

  const goToLab = () => {
    save();
    navigate("/laboratory");
  };

  const budgetPercent = report ? (report.totalCostMillionUSD / Math.max(1, budget)) * 100 : 0;

  return (
    <>
      <PageHeader
        eyebrow="MISSION DESIGN"
        title="Mission Planner"
        description="Define what the mission is for, where it is going, how long it will operate and how much money it has to work with."
        actions={
          <>
            <Button onClick={save} icon={<Check size={13} />}>
              Save mission
            </Button>
            <Button variant="primary" onClick={goToLab} icon={<ArrowRight size={13} />}>
              Configure spacecraft
            </Button>
          </>
        }
      />

      <PageBody>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {/* ------------------------------------------------------ identity */}
            <Panel title="Mission identity">
              <label className="block">
                <span className="label-tech">Mission name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={missionName}
                  className="mt-1.5 w-full rounded-[3px] border border-line bg-abyss px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-accent/60"
                />
              </label>
            </Panel>

            {/* --------------------------------------------------- destination */}
            <Panel
              title="Destination"
              subtitle="The target drives the power budget, the radiation environment, the transfer energy and the funding cap."
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DESTINATION_PLANETS.map((planet) => {
                  const active = destinationId === planet.id;
                  const bodyProfile = DESTINATION_PROFILES[planet.id as DestinationId];
                  return (
                    <button
                      key={planet.id}
                      type="button"
                      onClick={() => handleSelectDestination(planet.id as DestinationId)}
                      className={`flex flex-col items-center gap-1.5 border px-2 py-3 transition-colors ${
                        active
                          ? "border-accent/50 bg-accent/10"
                          : "border-line bg-abyss/50 hover:border-accent-soft/40"
                      }`}
                    >
                      <span
                        className="h-5 w-5 rounded-full border border-white/10"
                        style={{
                          background: `radial-gradient(circle at 32% 30%, ${planet.accent}, ${planet.color} 62%, #10161f 100%)`,
                        }}
                      />
                      <span className="text-[12px] font-medium text-ink">{planet.name}</span>
                      <span className="value-num text-[10px] text-ink-muted">
                        {planet.semiMajorAxisAU.toFixed(2)} AU
                      </span>
                      <span
                        className={`label-tech ${bodyProfile.difficulty === "extreme" ? "text-danger" : bodyProfile.difficulty === "hard" ? "text-warning" : "text-ink-muted"}`}
                      >
                        {bodyProfile.difficulty}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="hairline mt-4 pt-3">
                <p className="text-[12px] leading-relaxed text-ink-muted">{profile.brief}</p>
                <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">{profile.launchNote}</p>
              </div>
            </Panel>

            {/* ---------------------------------------------------- objectives */}
            <Panel
              title="Scientific objectives"
              subtitle="Objectives are completed by instruments whose science discipline matches them."
            >
              <ul className="space-y-2">
                {objectives.map((objective) => {
                  const selected = objectiveIds.includes(objective.id);
                  return (
                    <li key={objective.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setObjectiveIds((current) =>
                            selected
                              ? current.filter((id) => id !== objective.id)
                              : [...current, objective.id],
                          )
                        }
                        className={`flex w-full gap-3 border px-3 py-2.5 text-left transition-colors ${
                          selected
                            ? "border-accent/50 bg-accent/10"
                            : "border-line bg-abyss/50 hover:border-accent-soft/40"
                        }`}
                      >
                        <span className="mt-0.5 shrink-0">
                          {selected ? (
                            <CircleCheck size={15} className="text-accent" />
                          ) : (
                            <span className="block h-[15px] w-[15px] border border-line" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-[12px] font-medium text-ink">{objective.title}</span>
                            <span className="label-tech">{objective.difficulty}</span>
                          </span>
                          <span className="mt-1 block text-[11px] leading-relaxed text-ink-muted">
                            {objective.description}
                          </span>
                          <span className="value-num mt-1.5 block text-[10px] text-accent-soft">
                            {objective.instrumentCategories.join(" · ")} — {objective.reward} science points
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            {/* -------------------------------------------- duration and budget */}
            <Panel title="Science window and funding">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="label-tech">Science window</span>
                    <span className="value-num text-[12px] text-accent">{durationMonths} months</span>
                  </div>
                  <input
                    type="range"
                    min={profile.minDurationMonths}
                    max={profile.maxDurationMonths}
                    step={1}
                    value={durationMonths}
                    onChange={(event) => setDurationMonths(Number(event.target.value))}
                    className="w-full accent-[#83c9f2]"
                    aria-label="Science window in months"
                  />
                  <div className="value-num mt-1 flex justify-between text-[10px] text-ink-muted">
                    <span>{profile.minDurationMonths} mo</span>
                    <span>recommended {profile.recommendedDurationMonths} mo</span>
                    <span>{profile.maxDurationMonths} mo</span>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="label-tech">Funding cap</span>
                    <span className="value-num text-[12px] text-accent">{money(budget, 0)}</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={Math.max(2000, profile.budgetMillionUSD * 2)}
                    step={50}
                    value={budget}
                    onChange={(event) => setBudget(Number(event.target.value))}
                    className="w-full accent-[#83c9f2]"
                    aria-label="Funding cap in millions of dollars"
                  />
                  <div className="value-num mt-1 flex justify-between text-[10px] text-ink-muted">
                    <span>$100M</span>
                    <span>profile {money(profile.budgetMillionUSD, 0)}</span>
                    <span>{money(Math.max(2000, profile.budgetMillionUSD * 2), 0)}</span>
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          {/* ------------------------------------------------------ summary rail */}
          <div className="space-y-4">
            <Panel title="Mission summary">
              <div className="space-y-3">
                <Metric label="Mission" value={missionName} size="sm" />
                <div className="hairline pt-3">
                  <DataRow label="Destination" value={PLANET_BY_ID[destinationId].name} />
                  <DataRow label="Distance" value={`${num(PLANET_BY_ID[destinationId].semiMajorAxisAU, 2)} AU`} />
                  <DataRow label="Objectives" value={String(objectiveIds.length)} />
                  <DataRow label="Science window" value={`${durationMonths} months`} />
                  <DataRow label="Funding cap" value={money(budget, 0)} />
                  <DataRow
                    label="Solar flux"
                    value={`${num(PLANET_BY_ID[destinationId].solarConstantRelative * 100, 1)}% of Earth`}
                  />
                </div>
              </div>
            </Panel>

            {report ? (
              <Panel title="Cost against the cap">
                <div className="flex items-baseline justify-between">
                  <span className="value-num text-[20px] text-ink">{money(report.totalCostMillionUSD)}</span>
                  <StatusDot
                    tone={
                      report.totalCostMillionUSD > budget
                        ? "danger"
                        : budgetPercent > 92
                          ? "warning"
                          : "success"
                    }
                    label={`${num(budgetPercent, 0)}% of cap`}
                  />
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line/70">
                  <div
                    className={`h-full ${budgetPercent > 100 ? "bg-danger" : budgetPercent > 92 ? "bg-warning" : "bg-success"}`}
                    style={{ width: `${Math.min(100, budgetPercent)}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
                  Includes the launch vehicle and every selected subsystem. Changing components in the laboratory updates
                  this figure immediately.
                </p>
              </Panel>
            ) : null}

            {touched && issues.length > 0 ? (
              <Panel title="Cannot continue yet">
                <ul className="space-y-1.5">
                  {issues.map((issue) => (
                    <li key={issue} className="flex gap-2 text-[11px] leading-snug text-warning">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}

            <Panel title="Next steps">
              <ol className="space-y-2 text-[11px] leading-relaxed text-ink-muted">
                {[
                  ["1", "Choose the destination and objectives", true],
                  ["2", "Build the spacecraft in the laboratory", false],
                  ["3", "Select a launch vehicle", false],
                  ["4", "Review the orbital plan", false],
                  ["5", "Launch and fly the mission", false],
                ].map(([index, text, done]) => (
                  <li key={String(text)} className="flex gap-2.5">
                    <span className={`value-num ${done ? "text-success" : "text-ink-muted"}`}>{index}</span>
                    <span className={done ? "text-ink" : undefined}>{text}</span>
                  </li>
                ))}
              </ol>
              <Button
                className="mt-3 w-full"
                variant="primary"
                icon={<FlaskConical size={13} />}
                onClick={goToLab}
              >
                Open the spacecraft laboratory
              </Button>
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  );
}
