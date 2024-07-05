
// Reference: https://developers.google.com/fonts/docs/developer_api
interface RawFontInfo {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: Record<string, string>;
  category: string;
  kind: string;
  menu: string;
}

interface FontAPIResponse {
  kind: string;
  items: RawFontInfo[];
}

type Fonts = Record<string, RawFontInfo["files"]>

// export async function fetchFonts(): Promise<Font[]> {
//   // The API key is ok to be public
//   const fontAPIResponse: FontAPIResponse = await fetch('https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyB-n0oQkOwrP49lhJF5-jsNTptZg6kQowY')
//     .then((response) => response.json());
  
//   // Something went wrong when fetching the font list
//   if (!fontAPIResponse.items || !Array.isArray(fontAPIResponse.items)) {
//     throw new Error(`Invalid response from Google Font API: \n${fontAPIResponse}`);
//   }

//   const fonts: Font[] = [];

//   for (const { family, variants, files } of fontAPIResponse.items) {
//     fonts.push(
//       {
//         family,
//         variants,
//         files
//       }
//     );
//   }

//   return fonts;
// }

// export async function loadFont(fontURL: string): Promise<ArrayBuffer> {
//   return await fetch(fontURL)
//     .then((response) => response.arrayBuffer());
// }

export default class FontLoader {
  private fonts: Fonts = {};
  private isFontsFetched = false;

  // Constructor cannot be async, use fetchFonts instead
  constructor() {}

  get availableFonts() {
    return this.fonts;
  }

  async fetchFonts() {
    if (this.isFontsFetched) {
      return;
    }

    // The API key is ok to be public
    const fontAPIResponse: FontAPIResponse = await fetch(
        'https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyB-n0oQkOwrP49lhJF5-jsNTptZg6kQowY',
        {
          headers: {
            referer: 'https://lifecalendar.pages.dev'
          }
        }
      )
      .then((response) => response.json());
    
    // Something went wrong when fetching the font list
    if (!fontAPIResponse.items || !Array.isArray(fontAPIResponse.items)) {
      throw new Error(`Invalid response from Google Font API: \n${fontAPIResponse}`);
    }

    const fonts: Fonts = {};

    for (const { family, files } of fontAPIResponse.items) {
      fonts[family] = files;
    }

    this.fonts = fonts;
    this.isFontsFetched = true;
  }

  async loadFont(name: string, variant: string): Promise<ArrayBuffer> {
    // Google fonts uses regular to represent 400
    const normalizedVariant = variant === '400' ? 'regular' : variant;

    if (!this.isFontsFetched) {
      throw Error('Fonts has not been fetched, you may need to call fetchFonts first')
    }

    if (!(name in this.fonts)) {
      throw Error(`The requested font '${name}' does not exist`);
    }

    if (!(normalizedVariant in this.fonts[name])) {
      throw Error(`The requested varient '${normalizedVariant}' for '${name}' does not exist`);
    }

    return await fetch(this.fonts[name][normalizedVariant])
      .then((response) => response.arrayBuffer());
  }
}