import type { Font, FontStyle, FontWeight } from 'satori';

type ParsedFontVariant = Pick<Font, 'weight' | 'style'>

export function parseFontVariant(fontVariant: string): ParsedFontVariant {
  if (fontVariant === 'regular') {
    return {
      weight: 400
    }
  }

  if (fontVariant === 'italic') {
    return {
      weight: 400,
      style: 'italic'
    }
  }

  const weight = parseInt(fontVariant.substring(0, 3), 10) as FontWeight;
  const style = fontVariant.substring(3) as FontStyle;

  return {
    weight,
    ...(style && { style })
  }
}

export function fontVariantToHumanReadableRepresentation(variant: string) {
  if (variant === 'regular') {
    return '400';
  }

  if (variant === 'italic') {
    return '400 Italic';
  }

  return variant.replace(/([1-9]00)italic/, '$1 Italic');
}