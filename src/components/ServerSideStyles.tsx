import { Prediction } from '../lib/server-predictions';

interface ServerSideStylesProps {
  predictions: Prediction[];
}

export function ServerSideStyles({ predictions }: ServerSideStylesProps) {
  // Generate CSS rules from predictions
  const cssRules: string[] = [];

  predictions.forEach((prediction) => {
    if (prediction.type !== 'visual' || !prediction.config) {
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
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: cssRules.join('\n'),
      }}
    />
  );
}
