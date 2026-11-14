import { useEffect } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { pendingEvent, type SimulationConfig, type SimulationRuntime } from "@/engine/simulation";
import { num } from "@/utils/format";
import { sound } from "@/utils/sound";

/**
 * Mission event decision.
 *
 * The simulation pauses here and waits for the player. The risk roll is
 * deterministic for a given mission state, so the same build and the same
 * choices always produce the same outcome.
 */
export function EventDecisionModal({
  runtime,
  config,
  onDecide,
}: {
  runtime: SimulationRuntime;
  config: SimulationConfig;
  onDecide: (choiceId: string) => void;
}) {
  const event = pendingEvent(runtime, config);

  useEffect(() => {
    if (event) {
      sound.warning();
    }
  }, [event]);

  if (!event) return null;

  return (
    <Modal
      open
      onClose={() => undefined}
      title={event.title}
      subtitle={`Mission day ${num(runtime.elapsedDays, 1)} · spacecraft health ${num(runtime.health, 0)}%`}
      width="lg"
      footer={
        <span className="mr-auto text-[11px] text-ink-muted">
          The simulation is paused until a decision is made.
        </span>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 border border-line bg-abyss/60 px-3 py-2.5">
          <AlertTriangle
            size={15}
            className={`mt-0.5 shrink-0 ${event.severity === "danger" ? "text-danger" : "text-warning"}`}
          />
          <p className="text-[12px] leading-relaxed text-ink">{event.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {event.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => {
                sound.snap();
                onDecide(choice.id);
              }}
              className="group flex flex-col gap-2 rounded-[2px] border border-white/10 bg-[#0c0c0c] p-4 text-left font-mono transition-all hover:border-white hover:bg-[#161616] hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-[0.98]"
            >
              <span className="text-[12px] font-bold text-white">{choice.label}</span>
              <span className="text-[11px] leading-relaxed text-neutral-400">{choice.description}</span>

              <span className="mt-auto space-y-1 border-t border-white/10 pt-2.5">
                {choice.effects.powerMultiplier !== undefined ? (
                  <span className="value-num block text-[10px] text-neutral-400">
                    power × {num(choice.effects.powerMultiplier, 2)}
                  </span>
                ) : null}
                {choice.effects.scienceMultiplier !== undefined ? (
                  <span className="value-num block text-[10px] text-neutral-400">
                    science × {num(choice.effects.scienceMultiplier, 2)}
                  </span>
                ) : null}
                {choice.effects.downlinkMultiplier !== undefined ? (
                  <span className="value-num block text-[10px] text-neutral-400">
                    downlink × {num(choice.effects.downlinkMultiplier, 2)}
                  </span>
                ) : null}
                {choice.effects.healthDamage ? (
                  <span className="value-num block text-[10px] text-[#ff3344] font-bold">
                    health −{num(choice.effects.healthDamage, 0)}
                  </span>
                ) : null}
                {choice.effects.propellantLossKg ? (
                  <span className="value-num block text-[10px] text-[#ffb800] font-bold">
                    propellant −{num(choice.effects.propellantLossKg, 0)} kg
                  </span>
                ) : null}
                {choice.risk ? (
                  <span className="value-num flex items-center gap-1 text-[10px] text-[#ffb800]">
                    <ShieldAlert size={10} /> {num(choice.risk * 100, 0)}% chance of a worse outcome
                  </span>
                ) : (
                  <span className="value-num block text-[10px] text-[#00ff88]">no risk</span>
                )}
              </span>
            </button>
          ))}
        </div>

        <p className="text-[10px] leading-relaxed text-ink-muted">
          Every choice is evaluated against the actual spacecraft configuration. A design with a large power reserve
          survives the events a marginal design does not.
        </p>
      </div>
    </Modal>
  );
}
