import { parse } from '@twemoji/parser';

export default async function loadEmoji(emojiString: string) {
  const { url } =  parse(
    emojiString,
    {
      assetType: 'svg'
    }
  )[0];

  const emojiSVG = await fetch(url).then((response) => response.text());

  return `data:image/svg+xml,${encodeURIComponent(emojiSVG)}`;
}