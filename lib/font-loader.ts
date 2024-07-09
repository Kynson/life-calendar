
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

export type Fonts = Record<string, Pick<RawFontInfo, 'files' | 'variants'>>

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

    for (const { family, files, variants } of fontAPIResponse.items) {
      fonts[family] = {
        files,
        variants
      };
    }

    this.fonts = fonts;
    this.isFontsFetched = true;
  }

  async loadFont(family: string, variant: string): Promise<ArrayBuffer> {
    if (!this.isFontsFetched) {
      throw Error('Fonts has not been fetched, you may need to call fetchFonts first')
    }

    if (!(family in this.fonts)) {
      throw Error(`The requested font '${family}' does not exist`);
    }

    if (!this.fonts[family].variants.includes(variant)) {
      console.log(this.fonts[family].variants)
      throw Error(`The requested varient '${variant}' for '${family}' does not exist`);
    }

    return await fetch(this.fonts[family].files[variant])
      .then((response) => response.arrayBuffer());
  }
}