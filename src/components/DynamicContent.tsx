import { Prediction } from '../lib/server-predictions';

interface DynamicContentProps {
  predictions: Prediction[];
  selector: string;
  children: React.ReactNode;
  className?: string;
}

export function DynamicContent({ predictions, selector, children, className }: DynamicContentProps) {
  // Find predictions that affect this component
  const relevantPrediction = predictions.find(
    (pred) => pred.type === 'visual' && pred.config?.selector === selector
  );

  if (!relevantPrediction || !relevantPrediction.config) {
    return <div className={className}>{children}</div>;
  }

  const { action } = relevantPrediction.config;
  const value = relevantPrediction.value;

  // Handle text content changes
  if (action === 'setText') {
    return <div className={className}>{value}</div>;
  }

  // Handle HTML content changes
  if (action === 'setInnerHTML') {
    return (
      <div 
        className={className}
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

  return <div className={finalClassName}>{children}</div>;
}
