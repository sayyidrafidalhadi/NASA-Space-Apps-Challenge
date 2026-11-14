import { Modal } from "@/components/ui/Modal";
import { SOURCE_CITATIONS } from "@/data/planets";

/**
 * Data sources and scientific-integrity notes.
 *
 * The application distinguishes three kinds of number:
 *   • published science  — the physical constants and mission facts,
 *   • simplified physics — the educational models used in the engine,
 *   • gameplay values    — component masses, costs and scoring weights.
 */

const HONESTY: Array<{ title: string; real: string; modelled: string; tuned: string }> = [
  {
    title: "Planetary data",
    real:
      "Radii, masses, heliocentric elements, rotation periods, temperatures and escape velocities come from the NASA NSSDC Planetary Fact Sheet.",
    modelled: "Positions in the 3D navigator use mean elements evaluated at the mission epoch.",
    tuned: "Hazard indices and science objective lists are educational gameplay parameters.",
  },
  {
    title: "Launch vehicles",
    real:
      "Payload to LEO and GTO, dimensions, thrust, first flight and cost are published operator and NASA Launch Services Program figures.",
    modelled:
      "Payload to a planetary destination is an educational estimate: published LEO capacity multiplied by a destination mass fraction that encodes transfer energy.",
    tuned: "The mass fractions are gameplay parameters, not performance curves.",
  },
  {
    title: "Propulsion",
    real: "Specific impulse and thrust are scaled from flight hardware.",
    modelled:
      "The Tsiolkovsky rocket equation is used with an ideal impulsive burn. Real mission budgets add 10–30% for gravity, drag and finite-burn losses.",
    tuned: "Propellant tank capacities are gameplay values.",
  },
  {
    title: "Power",
    real:
      "The inverse-square law between solar output and heliocentric distance is real physics, and radioisotope sources are modelled as distance-independent.",
    modelled:
      "Loads use duty cycles rather than peak draw, and the battery is a simple energy store with a depth-of-discharge limit.",
    tuned: "Array output, battery capacity and instrument draw are scaled gameplay values.",
  },
  {
    title: "Communications",
    real:
      "Free-space path loss grows with the square of range, and the Deep Space Network provides eight hours of contact per day.",
    modelled:
      "Each system quotes a rate at a reference range and scales from there. Weather, pointing jitter and antenna geometry are not modelled.",
    tuned: "Downlink rates and recorder sizes are gameplay values.",
  },
  {
    title: "Thermal control",
    real:
      "The radiator rejects heat by the Stefan–Boltzmann relation, and the model is solved in kelvin against a 3 K deep-space sink.",
    modelled: "Steady-state balance only: no transient soak, no conduction paths, no heater duty cycles.",
    tuned: "Radiator areas and thermal ratings are gameplay values.",
  },
  {
    title: "Scoring",
    real: "Nothing — this is a game.",
    modelled:
      "Every ratio is computed from the flown mission state; nothing is pre-assigned.",
    tuned:
      "The weights (science 30%, engineering 25%, completion 20%, budget 15%, resources 10%) and the anomaly pool are design choices.",
  },
];

export function DataSourcesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Data sources and scientific integrity"
      subtitle="What is published science, what is simplified physics, and what is a gameplay value."
      width="lg"
    >
      <div className="space-y-5">
        <div>
          <div className="label-tech mb-2">Referenced datasets</div>
          <ul className="space-y-2">
            {SOURCE_CITATIONS.map((source) => (
              <li key={source.url} className="border border-line bg-abyss/60 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[12px] font-semibold text-ink">{source.name}</span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="value-num text-[10px] text-accent underline-offset-2 hover:underline"
                  >
                    {source.shortName}
                  </a>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{source.description}</p>
                <p className="mt-1 text-[10px] text-ink-muted/80">
                  <span className="label-tech">Used for</span> {source.usedFor}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="label-tech mb-2">Honesty notes</div>
          <div className="overflow-hidden border border-line">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-elevated">
                  <th className="label-tech border-b border-line px-3 py-2">Topic</th>
                  <th className="label-tech border-b border-line px-3 py-2">Real</th>
                  <th className="label-tech border-b border-line px-3 py-2">Modelled</th>
                  <th className="label-tech border-b border-line px-3 py-2">Tuned</th>
                </tr>
              </thead>
              <tbody>
                {HONESTY.map((row) => (
                  <tr key={row.title} className="align-top">
                    <td className="border-b border-line px-3 py-2 text-[11px] font-medium text-ink">
                      {row.title}
                    </td>
                    <td className="border-b border-line px-3 py-2 text-[11px] leading-relaxed text-ink-muted">
                      {row.real}
                    </td>
                    <td className="border-b border-line px-3 py-2 text-[11px] leading-relaxed text-ink-muted">
                      {row.modelled}
                    </td>
                    <td className="border-b border-line px-3 py-2 text-[11px] leading-relaxed text-ink-muted">
                      {row.tuned}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-ink-muted">
          MISSIONFORGE is an independent educational project built for the NASA Space Apps Challenge. It is not an
          official NASA product, it is not endorsed by NASA, and it must not be used to design a real spacecraft.
        </p>
      </div>
    </Modal>
  );
}
