import type { Prediction } from '@ezbot-ai/javascript-sdk';
import { getVisualForSelector } from '@ezbot-ai/javascript-sdk';

/**
 * DynamicContent
 * 
 * Renders a wrapper <div> whose contents/classes can be modified based on a matching
 * visual prediction (by `config.selector`). Use this when you want targeted text or
 * HTML changes or to add/remove classes for a specific block.
 *
 * Example
 * ```tsx
 * <DynamicContent
 *   predictions={predictions}
 *   selector=".hero-title"
 *   className="hero-title text-2xl font-bold"
 * >
 *   Default Title
 * </DynamicContent>
 * ```
 */

interface DynamicContentProps {
  predictions: Prediction[];
  selector: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function DynamicContent({ predictions, selector, children, className, id }: DynamicContentProps) {
  // Find predictions that affect this component
  const relevantPrediction = getVisualForSelector(predictions, selector);

  if (!relevantPrediction || !relevantPrediction.config) {
    return <div className={className} id={id}>{children}</div>;
  }

  const { action } = relevantPrediction.config;
  const value = relevantPrediction.value;

  // Handle text content changes
  if (action === 'setText') {
    return <div className={className} id={id}>{value}</div>;
  }

  // Handle HTML content changes
  if (action === 'setInnerHTML') {
    return (
      <div 
        className={className}
        id={id}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }

  // Handle class modifications
  let finalClassName = className || '';
  if (action === 'addClasses') {
    finalClassName = `${finalClassName} ${value}`.trim();
  } else if (action === 'removeClasses') {
    const classesToRemove = value.split(' ');
    finalClassName = finalClassName
      .split(' ')
      .filter(cls => !classesToRemove.includes(cls))
      .join(' ');
  }

  return <div className={finalClassName} id={id}>{children}</div>;
}
