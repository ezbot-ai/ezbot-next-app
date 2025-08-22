import { Prediction } from '../lib/server-predictions';

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

  // Generate CSS rules from predictions
  const cssRules: string[] = [];

  predictions.forEach((prediction) => {
    if (!prediction || prediction.type !== 'visual' || !prediction.config) {
      return;
    }

    const { selector, action, attribute } = prediction.config;
    const value = prediction.value;

    switch (action) {
      case 'hide':
        cssRules.push(`${selector} { display: none !important; }`);
        break;
      case 'show':
        cssRules.push(`${selector} { display: block !important; }`);
        break;
      case 'setStyle':
        if (attribute) {
          cssRules.push(`${selector} { ${attribute}: ${value} !important; }`);
        }
        break;
      case 'setFontSize':
        cssRules.push(`${selector} { font-size: ${value} !important; }`);
        break;
      case 'setFontColor':
        cssRules.push(`${selector} { color: ${value} !important; }`);
        break;
      case 'setBackgroundColor':
        cssRules.push(`${selector} { background-color: ${value} !important; }`);
        break;
      case 'setVisibility':
        cssRules.push(`${selector} { visibility: ${value} !important; }`);
        break;
      case 'addGlobalCSS':
        cssRules.push(value);
        break;
    }
  });

  if (cssRules.length === 0) {
    console.log("ServerSideStyles: No CSS rules generated, returning null");
    return null;
  }

  console.log("ServerSideStyles: Generated", cssRules.length, "CSS rules");
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: cssRules.join('\n'),
      }}
    />
  );
}
