import type { Prediction } from '@ezbot-ai/javascript-sdk';
import { predictionsToCss } from '@ezbot-ai/javascript-sdk';

/**
 * ServerSideStyles
 *
 * Converts visual predictions into CSS rules and injects them into the page via a
 * single `<style>` tag. Use this for global visual adjustments such as hide/show,
 * setting CSS properties, or adding global CSS rules. Ideal for SSR so styles apply
 * before hydration.
 *
 * Example
 * ```tsx
 * // In your page/layout where predictions are available server-side
 * <ServerSideStyles predictions={predictions} />
 * ```
 */

interface ServerSideStylesProps {
  predictions: Prediction[];
}

export function ServerSideStyles({ predictions }: ServerSideStylesProps) {
  console.log("ServerSideStyles rendering with", predictions?.length || 0, "predictions");
  
  // Handle empty or invalid predictions gracefully
  if (!predictions || !Array.isArray(predictions)) {
    console.log("ServerSideStyles: No valid predictions, returning null");
    return null;
  }

  // Generate CSS string from predictions via SDK helper
  const css = predictionsToCss(predictions);

  if (!css || css.length === 0) {
    console.log("ServerSideStyles: No CSS rules generated, returning null");
    return null;
  }

  console.log("ServerSideStyles: Generated CSS for predictions");
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: css,
      }}
    />
  );
}
