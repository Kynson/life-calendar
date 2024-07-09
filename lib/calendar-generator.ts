import satori, { init as initSatori } from 'satori/wasm';
import initYoga from 'yoga-wasm-web';
import yogaWasm from 'yoga-wasm-web/dist/yoga.wasm';

import FontLoader from './font-loader';
import { parseFontVariant } from './font-variant-utils';

interface ReactLikeElementProps {
  style: Record<string, any>,
  children: ReactLikeElement | ReactLikeElement[] | string,
}
interface ReactLikeElement {
  type: keyof HTMLElementTagNameMap,
  props: ReactLikeElementProps
}
type ReactLikeElementGenerator = Record<keyof HTMLElementTagNameMap, (styles?: ReactLikeElementProps['style'], children?: ReactLikeElementProps['children']) => ReactLikeElement>;

type FlexDirection = 'column' | 'row';
type GridDirection = 'vertical' | 'horizontal';

interface CellFillRule {
  color: string,
  startingFrom: number
}

export interface GenerateConfigurations {
  dateOfBirth: string,
  filledCellColor: string,
  unfilledCellColor: string,
  direction: GridDirection,
  title: string,
  numberOfYears: number,
  titleColor: string,
  eventLegendsColor: string,
  progressColor: string,
  showTitle: boolean,
  showEventLegends: boolean,
  showProgress: boolean,
  enableEmojiSupport: boolean,
  fontFamily: string,
  fontVariant: string
}

const BASE_FONT_SIZE = 16;

const GRID_CELL_SIZE = 5;
const GRID_CELL_BORDER_RADIUS = 1;
const GRID_GAP = 1;
const GRID_MARGIN_BOTTOM = 8;

const TITLE_FONT_SIZE = 18;
const TITLE_MARGIN_BOTTOM = 16;
const TITLE_LINE_HEIGHT = TITLE_FONT_SIZE + 2;

const PROGRESS_FONT_SIZE = BASE_FONT_SIZE * 0.833;
const PROGRESS_LINE_HEIGHT = BASE_FONT_SIZE + 2;

const NUMBER_OF_WEEKS_IN_YEAR = 52;

const reactLikeElementGenerator = new Proxy<ReactLikeElementGenerator>(
  {} as ReactLikeElementGenerator,
  {
    get(_target, property) {
      return (styles: ReactLikeElementProps['style'] = {}, children: ReactLikeElementProps['children'] = '') => {
        return {
          type: property,
          props: {
            style: styles,
            children
          }
        }
      }
    }
  }
);

export default class CalendarGenerator {
  private fontLoader = new FontLoader();
  private isInitialized = false;

  // Default configurations
  // The configurations is intentionally made public as this makes binding to form control easier in front end
  public configurations: GenerateConfigurations = {
    dateOfBirth: new Date().toISOString().split('T')[0],
    filledCellColor: '#90caf9',
    unfilledCellColor: '#e0e0e0',
    direction: 'horizontal',
    title: 'Life Calendar',
    numberOfYears: 100,
    titleColor: '#ffffff',
    eventLegendsColor: '#ffffff',
    progressColor: '#ffffff',
    showTitle: true,
    showEventLegends: true,
    showProgress: true,
    enableEmojiSupport: false,
    fontFamily: 'Inter',
    fontVariant: 'regular'
  }

  // Constructor cannot be async, use initialize instead
  constructor() {}

  get availableFonts() {
    return this.fontLoader.availableFonts;
  }

  private generateCell(fillColor: string, width: number | string, height: number | string, borderRadius: number | string): ReactLikeElement {
    return reactLikeElementGenerator.div(
      {
        backgroundColor: fillColor,
        width,
        height,
        borderRadius
      }
    );
  }

  // Flexbox should allow more than 1 children, so we only accept array here
  private generateFlexbox(
    direction: FlexDirection,
    gap?: number | string,
    width?: number | string,
    height?: number | string,
    marginBottom?: number | string,
    children: ReactLikeElement[] = []
  ): ReactLikeElement {
    return reactLikeElementGenerator.div(
      {
        display: 'flex',
        flexDirection: direction,
        // Only add width, height, gap and margin if it is supplied, an undefined value will lead to error in satori
        ...(width && { width }),
        ...(height && { height }),
        ...(gap && { gap }),
        ...(marginBottom && { marginBottom })
      },
      children
    );
  }

  private isValidCellFillRules(cellFillRules: CellFillRule[]) {
    for (let i = 0; i < cellFillRules.length; i++) {
      if (!/^#([0-9a-f]{6}|[0-9a-f]{3})$/.test(cellFillRules[i].color)) {
        return false;
      }

      if (i >= 1 && cellFillRules[i - 1].startingFrom >= cellFillRules[i].startingFrom) {
        return false;
      }
    }

    return true;
  }

  private computeGridDimension() {
    const { numberOfYears } = this.configurations;

    // [width, height] for horizontal and [height, width] for vertical
    return [
      GRID_CELL_SIZE * numberOfYears + GRID_GAP * (numberOfYears - 1),
      GRID_CELL_SIZE * NUMBER_OF_WEEKS_IN_YEAR + GRID_GAP * (NUMBER_OF_WEEKS_IN_YEAR - 1)
    ];
  }

  private generateGrid(
    cellFillRules: CellFillRule[]
  ) {
    const { direction, numberOfYears, showProgress } = this.configurations;

    if (cellFillRules.length === 0) {
      throw Error('There must be at least one cell fill rule but found none');
    }

    if (!this.isValidCellFillRules(cellFillRules)) {
      throw Error(`Invalid cell fill rules: ${JSON.stringify(cellFillRules)}`);
    }

    const isHorizontal = direction === 'horizontal';
    const gridDimension = this.computeGridDimension();

    const grid = this.generateFlexbox(
      isHorizontal ? 'row' : 'column',
      GRID_GAP,
      gridDimension[isHorizontal ? 0 : 1],
      gridDimension[isHorizontal ? 1 : 0],
      showProgress ? GRID_MARGIN_BOTTOM : 0
    );

    let currentCellFillRuleIndex = 0;

    for (let i = 0; i < numberOfYears; i++) {
      const line = this.generateFlexbox(
        isHorizontal ? 'column' : 'row',
        GRID_GAP
      );

      for (let j = 0; j < NUMBER_OF_WEEKS_IN_YEAR; j++) {
        const nextCellFillRule = cellFillRules[currentCellFillRuleIndex + 1];
        if (nextCellFillRule && nextCellFillRule.startingFrom === i * NUMBER_OF_WEEKS_IN_YEAR + j) {
          currentCellFillRuleIndex++;
        }

        const { color: fillColor } = cellFillRules[currentCellFillRuleIndex];
        const cell = this.generateCell(fillColor, GRID_CELL_SIZE, GRID_CELL_SIZE, GRID_CELL_BORDER_RADIUS);

        (line.props.children as ReactLikeElement[]).push(cell);
      }

      (grid.props.children as ReactLikeElement[]).push(line);
    }

    return grid;
  }

  private computeCalendarDimension() {
    const { direction, showTitle, showProgress } = this.configurations;

    const gridDimension = this.computeGridDimension();
    const titleHeight = showTitle ? TITLE_LINE_HEIGHT + TITLE_MARGIN_BOTTOM : 0;
    // Grid margin only apply when progress is shown
    const progressHeight = showProgress ? PROGRESS_LINE_HEIGHT + GRID_MARGIN_BOTTOM : 0;

    if (direction === 'horizontal') {
      return {
        width: gridDimension[0],
        height: gridDimension[1] + titleHeight + progressHeight + 1
      }
    }

    return {
      width: gridDimension[1],
      height: gridDimension[0] + titleHeight + progressHeight + 1 + 200
    };
  }

  public async initialize() {
    if (this.isInitialized) {
      return;
    }

    const yoga = await initYoga(yogaWasm);
    initSatori(yoga);

    await this.fontLoader.fetchFonts();

    this.isInitialized = true;
  }

  public updateConfigurations(configurations: Partial<GenerateConfigurations>) {
    this.configurations = {
      ...this.configurations,
      ...configurations
    };
  }

  public async generate() {
    const {
      dateOfBirth,
      filledCellColor,
      unfilledCellColor,
      direction,
      title,
      numberOfYears,
      titleColor,
      eventLegendsColor,
      progressColor,
      showTitle,
      showEventLegends,
      showProgress,
      enableEmojiSupport,
      fontFamily,
      fontVariant
    } = this.configurations;
    const { width, height } = this.computeCalendarDimension();

    const loadedFont = {
      name: fontFamily,
      data: await this.fontLoader.loadFont(fontFamily, fontVariant.toString()),
      ...parseFontVariant(fontVariant)
    }

    const currentTime = new Date().getTime();
    const birthday = new Date(dateOfBirth).getTime();
    const difference = currentTime - birthday;
    const numberOfWeeksElapsed = Math.floor(difference / (7 * 24 * 60 * 60 * 1000)) + 1;

    const calendarContents: ReactLikeElement[] = [];
    
    if (showTitle) {
      calendarContents.push(
        reactLikeElementGenerator.p(
          {
            fontSize: TITLE_FONT_SIZE,
            lineHeight: `${TITLE_LINE_HEIGHT}px`,
            margin: `0 0 ${TITLE_MARGIN_BOTTOM}px 0`,
            color: titleColor
          },
          title
        )
      );
    }

    calendarContents.push(
      this.generateGrid(
        [
          { color: filledCellColor, startingFrom: 0 },
          { color: unfilledCellColor, startingFrom: numberOfWeeksElapsed }
        ]
      )
    );

    if (showProgress) {
      calendarContents.push(
        reactLikeElementGenerator.p(
          {
            alignSelf: 'flex-end',
            fontSize: `${PROGRESS_FONT_SIZE}px`,
            lineHeight: `${PROGRESS_LINE_HEIGHT}px`,
            margin: 0,
            color: progressColor
          },
          `${numberOfWeeksElapsed}/${numberOfYears * NUMBER_OF_WEEKS_IN_YEAR}`
        )
      )
    }

    const rawGeneratedSVG = await satori(
      reactLikeElementGenerator.div(
        {
          font: `${BASE_FONT_SIZE}px '${fontFamily}'`,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'wrap',
        },
        calendarContents
      ),
      {
        width,
        height,
        fonts: [loadedFont],
        async loadAdditionalAsset(languageCode, segment) {
          if (languageCode !== 'emoji' || !enableEmojiSupport) {
            return;
          }

          const { default: loadEmoji } = await import('@lib/emoji-loader');

          return await loadEmoji(segment);
        },
      }
    );

    return {
      width,
      height,
      result: rawGeneratedSVG
        .replace(/width="\d*"/, '')
        .replace(/height="\d*"/, '')
    }
  }
}