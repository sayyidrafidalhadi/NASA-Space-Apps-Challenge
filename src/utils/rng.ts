/**
 * Deterministic pseudo-random number generation.
 *
 * The mission simulation must be reproducible: the same spacecraft, the same
 * seed and the same decisions always produce the same mission. All randomness
 * therefore comes from an explicit, serialisable generator state rather than
 * `Math.random`.
 */

/** FNV-1a string hash, used to turn a build into a stable seed. */
export function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Mulberry32 PRNG. The state is carried through the simulation so that a
 *  mission can be resumed or replayed exactly. */
export function nextRandom(state: number): { value: number; state: number } {
  let t = (state + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: t | 0 };
}

/** Convenience wrapper that advances an internal state. */
export function createRng(seed: number) {
  let state = seed >>> 0;
  return {
    next(): number {
      const result = nextRandom(state);
      state = result.state;
      return result.value;
    },
    get state(): number {
      return state;
    },
    set state(value: number) {
      state = value >>> 0;
    },
  };
}

/** A seed derived from a mission identifier and a build key. */
export function seedFromKey(key: string): number {
  return hashString(key) || 1;
}
