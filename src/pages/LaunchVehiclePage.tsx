import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Info, Rocket, XCircle } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { DataRow, Metric, StatusDot } from "@/components/ui/Metric";
import { Tooltip } from "@/components/ui/Tooltip";
import { EmptyState } from "@/components/ui/EmptyState";
import { LAUNCH_VEHICLES } from "@/data/launchVehicles";
import { PLANET_BY_ID } from "@/data/planets";
import { useMissionStore } from "@/store/missionStore";
import { useEngineeringReport } from "@/hooks/useEngineering";
import { money, num, percent } from "@/utils/format";
import { sound } from "@/utils/sound";

/**
 * Launch Vehicle Selection.
 *
 * A catalogue built from published vehicle data. Per-destination payload
 * figures are educational estimates and are labelled as such wherever they
 * appear.
 */
export function LaunchVehiclePage() {
  const navigate = useNavigate();
  const mission = useMissionStore((state) =>
    state.missions.find((item) => item.id === state.currentMissionId),
  );
  const updateMission = useMissionStore((state) => state.updateMission);
  const report = useEngineeringReport();

  const destination = mission ? PLANET_BY_ID[mission.destinationId] : null;

  const rows = useMemo(
    () =>
      LAUNCH_VEHICLES.map((vehicle) => {
        const capacity = vehicle.estimatedPayloadKg[mission?.destinationId ?? "mars"] ?? 0;
        const launchMass = report?.launchMassKg ?? 0;
        const massMargin = capacity > 0 ? ((capacity - launchMass) / capacity) * 100 : 0;
        const totalCost = vehicle.published.costMillionUSD + (report?.componentCostMillionUSD ?? 0);
        const budgetMargin =
          mission && mission.budgetMillionUSD > 0
            ? ((mission.budgetMillionUSD - totalCost) / mission.budgetMillionUSD) * 100
            : 0;
        return {
          vehicle,
          capacity,
          launchMass,
          massMargin,
          totalCost,
          budgetMargin,
          massOk: capacity > 0 && launchMass <= capacity,
          budgetOk: totalCost <= (mission?.budgetMillionUSD ?? 0),
        };
      }),
    [mission, report],
  );

  if (!mission) {
    return (
      <>
        <PageHeader eyebrow="LAUNCH" title="Launch Vehicle Selection" />
        <PageBody>
          <Panel>
            <EmptyState
              icon={<Rocket size={20} strokeWidth={1.4} />}
              title="No active mission"
              description="Select a mission before choosing a launch vehicle — the destination determines the payload class required."
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

  const selectedVehicleId = mission.launchVehicleId;

  return (
    <>
      <PageHeader
        eyebrow="LAUNCH"
        title="Launch Vehicle Selection"
        description={`Published performance for every vehicle in the catalogue, and the estimated payload each can deliver to ${destination?.name}.`}
        actions={
          <Button variant="primary" icon={<ArrowRight size={13} />} onClick={() => navigate("/trajectory")}>
            Review the orbital plan
          </Button>
        }
      />

      <PageBody>
        <div className="mb-4 flex items-start gap-2 border border-line bg-abyss/60 px-3 py-2.5">
          <Info size={13} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-[11px] leading-relaxed text-ink-muted">
            LEO and GTO payloads, dimensions, thrust and cost are published figures. The{" "}
            <span className="text-ink">estimated payload to {destination?.name}</span> column is an educational
            estimate: published LEO capacity multiplied by a destination mass fraction that encodes the transfer energy.
            These are not advertised vehicle capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {rows.map(({ vehicle, capacity, launchMass, massMargin, totalCost, budgetMargin, massOk, budgetOk }) => {
            const selected = selectedVehicleId === vehicle.id;
            const viable = massOk && budgetOk;
            return (
              <Panel
                key={vehicle.id}
                title={vehicle.name}
                subtitle={vehicle.provider}
                beam={selected}
                className={selected ? "!border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]" : ""}
                actions={
                  <StatusDot
                    tone={viable ? "success" : massOk ? "warning" : "danger"}
                    label={viable ? "VIABLE" : massOk ? "TIGHT" : "INFEASIBLE"}
                  />
                }
              >
                <p className="text-[12px] leading-relaxed text-ink-muted">{vehicle.description}</p>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Metric
                    label="Est. payload to target"
                    value={num(capacity, 0)}
                    unit="kg"
                    size="sm"
                    tone={massOk ? "success" : "danger"}
                  />
                  <Metric
                    label="Launch cost"
                    value={money(vehicle.published.costMillionUSD, 0)}
                    size="sm"
                  />
                </div>

                <div className="hairline mt-4 pt-3">
                  <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    <DataRow label="Payload to LEO" value={`${num(vehicle.published.payloadLEOKg, 0)} kg`} />
                    <DataRow
                      label="Payload to GTO"
                      value={vehicle.published.payloadGTOkg > 0 ? `${num(vehicle.published.payloadGTOkg, 0)} kg` : "Not applicable"}
                    />
                    <DataRow label="Height" value={`${num(vehicle.published.heightM, 1)} m`} />
                    <DataRow label="Diameter" value={`${num(vehicle.published.diameterM, 1)} m`} />
                    <DataRow label="Thrust at liftoff" value={`${num(vehicle.published.thrustKN, 0)} kN`} />
                    <DataRow label="First flight" value={vehicle.published.firstFlight} />
                    <DataRow label="Propulsion" value={vehicle.published.propulsion} />
                    <DataRow label="Reusable" value={vehicle.published.reusable ? "First stage" : "Expendable"} />
                  </div>
                </div>

                <div className="hairline mt-4 pt-3">
                  <div className="label-tech mb-1.5">Compatibility with this build</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px]">
                      {massOk ? (
                        <CheckCircle2 size={12} className="shrink-0 text-success" />
                      ) : (
                        <XCircle size={12} className="shrink-0 text-danger" />
                      )}
                      <span className="text-ink-muted">
                        {num(launchMass, 0)} kg spacecraft against {num(capacity, 0)} kg estimated capacity
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      {budgetOk ? (
                        <CheckCircle2 size={12} className="shrink-0 text-success" />
                      ) : (
                        <XCircle size={12} className="shrink-0 text-danger" />
                      )}
                      <span className="text-ink-muted">
                        {money(totalCost)} total against a {money(mission.budgetMillionUSD, 0)} cap
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <Metric
                      label="Mass margin"
                      value={percent(massMargin)}
                      size="sm"
                      tone={massMargin < 0 ? "danger" : massMargin < 8 ? "warning" : "success"}
                    />
                    <Metric
                      label="Budget margin"
                      value={percent(budgetMargin)}
                      size="sm"
                      tone={budgetMargin < 0 ? "danger" : budgetMargin < 8 ? "warning" : "success"}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Button
                    variant={selected ? "secondary" : "primary"}
                    className="flex-1"
                    icon={selected ? <CheckCircle2 size={13} /> : undefined}
                    onClick={() => {
                      sound.snap();
                      updateMission(mission.id, { launchVehicleId: vehicle.id, status: "configured" });
                    }}
                    disabled={selected}
                  >
                    {selected ? "Selected" : "Select vehicle"}
                  </Button>
                </div>

                <p className="mt-3 text-[10px] leading-relaxed text-ink-muted/80">{vehicle.source}</p>
              </Panel>
            );
          })}
        </div>

        <div className="mt-4">
          <Panel title="Estimation method">
            <p className="text-[11px] leading-relaxed text-ink-muted">
              Estimated payload to a destination is the published low-Earth-orbit capacity multiplied by a mass
              fraction that represents the energy class of that transfer. The fraction falls with increasing transfer
              energy: near-Earth orbit keeps the whole capacity, an inner-planet transfer keeps a few per cent, and a
              Neptune-class mission keeps around two per cent. Real mission design uses full trajectory optimisation with
              mass fraction curves that depend on the injection energy and the launch azimuth.
            </p>
            <div className="hairline mt-3 pt-3">
              <span className="label-tech">
                <Tooltip content="The mass fraction applied to each destination's published LEO capacity.">
                  Destination mass fractions
                </Tooltip>
              </span>
              <div className="mt-2 grid grid-cols-2 gap-x-6 sm:grid-cols-4">
                {(["earth", "venus", "mars", "mercury", "jupiter", "saturn", "uranus", "neptune"] as const).map(
                  (id) => {
                    const fraction =
                      LAUNCH_VEHICLES[0].estimatedPayloadKg[id] ?? 0;
                    const leo = LAUNCH_VEHICLES[0].published.payloadLEOKg;
                    return (
                      <DataRow
                        key={id}
                        label={PLANET_BY_ID[id].name}
                        value={`${percent((fraction / leo) * 100, 1)}`}
                      />
                    );
                  },
                )}
              </div>
            </div>
          </Panel>
        </div>
      </PageBody>
    </>
  );
}
