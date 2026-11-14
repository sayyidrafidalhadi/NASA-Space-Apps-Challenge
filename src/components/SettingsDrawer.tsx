import { Modal } from "@/components/ui/Modal";
import { useSettingsStore } from "@/store/settingsStore";
import type { GraphicsQuality } from "@/types";

const QUALITY_NOTES: Record<GraphicsQuality, string> = {
  low: "Fewer particles, lower device pixel ratio, no anti-aliasing. For integrated GPUs.",
  medium: "Balanced detail and resolution.",
  high: "Full detail, anti-aliasing and a higher pixel ratio.",
};

function Toggle({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span>
        <span className="block text-[12px] font-medium text-ink">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-ink-muted">{detail}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative mt-0.5 h-4 w-8 shrink-0 rounded-full border transition-colors ${
          checked ? "border-accent/60 bg-accent/30" : "border-line bg-elevated"
        }`}
      >
        <span
          className={`absolute top-[1px] h-3 w-3 rounded-full transition-transform ${
            checked ? "translate-x-[15px] bg-accent" : "translate-x-[1px] bg-ink-muted"
          }`}
        />
      </button>
    </label>
  );
}

export function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useSettingsStore();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Settings"
      subtitle="Display and guidance preferences. Saved locally in your browser."
      width="sm"
    >
      <div className="space-y-5">
        <div>
          <div className="label-tech mb-2">Graphics quality</div>
          <div className="grid grid-cols-3 gap-2">
            {(["low", "medium", "high"] as GraphicsQuality[]).map((quality) => (
              <button
                key={quality}
                type="button"
                onClick={() => settings.setGraphicsQuality(quality)}
                className={`rounded-[3px] border px-3 py-2 text-[11px] uppercase tracking-wide transition-colors ${
                  settings.graphicsQuality === quality
                    ? "border-accent/60 bg-accent/15 text-accent"
                    : "border-line bg-elevated text-ink-muted hover:text-ink"
                }`}
              >
                {quality}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-ink-muted">{QUALITY_NOTES[settings.graphicsQuality]}</p>
        </div>

        <div>
          <div className="label-tech mb-2">Guidance</div>
          <div className="grid grid-cols-2 gap-2">
            {(["guided", "advanced"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => settings.setEducationMode(mode)}
                className={`rounded-[3px] border px-3 py-2 text-[11px] uppercase tracking-wide transition-colors ${
                  settings.educationMode === mode
                    ? "border-accent/60 bg-accent/15 text-accent"
                    : "border-line bg-elevated text-ink-muted hover:text-ink"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-ink-muted">
            Guided mode explains every engineering term inline. Advanced mode shows the raw constraints and formulas.
          </p>
        </div>

        <div>
          <div className="label-tech mb-1">Display</div>
          <Toggle
            label="Show orbital paths"
            detail="Draw each planet's orbit in the navigator."
            checked={settings.showOrbits}
            onChange={settings.toggleOrbits}
          />
          <Toggle
            label="Show body labels"
            detail="Label planets in the 3D scene."
            checked={settings.showLabels}
            onChange={settings.toggleLabels}
          />
          <Toggle
            label="Show scale notice"
            detail="Explain the compressed visual scale wherever the 3D scene is used."
            checked={settings.showScaleNotice}
            onChange={settings.toggleScaleNotice}
          />
          <Toggle
            label="Reduce motion"
            detail="Disable non-essential animation."
            checked={settings.reduceMotion}
            onChange={settings.toggleReduceMotion}
          />
        </div>

        <button
          type="button"
          onClick={() => settings.reset()}
          className="w-full rounded-[3px] border border-line bg-elevated px-3 py-2 text-[11px] text-ink-muted transition-colors hover:text-ink"
        >
          Reset to defaults
        </button>
      </div>
    </Modal>
  );
}
