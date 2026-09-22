import { GlobeFallback } from "./GlobeFallback";
import { GLOBE_PLACEMENT, type GlobeVariant } from "./layout";

/**
 * The box the globe lives in. A size container, so the placeholder can be
 * positioned in container units that match the scene's pixel maths.
 */
export function GlobeStage({ variant }: { variant: GlobeVariant }) {
  return (
    <div className="absolute inset-0 overflow-hidden [container-type:size]">
      <GlobeFallback placement={GLOBE_PLACEMENT[variant]} />
    </div>
  );
}
