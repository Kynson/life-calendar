import satori, { init as initSatori } from 'satori/wasm';
import initYoga from 'yoga-wasm-web';
import yogaWasm from 'yoga-wasm-web/dist/yoga.wasm';

import FontLoader from './font-loader';

import type { SatoriOptions } from 'satori';

interface ReactLikeElementProps {
  style: Record<string, any>,
  children: ReactLikeElement | ReactLikeElement[] | string,
}
interface ReactLikeElement {
  type: keyof HTMLElementTagNameMap,
  props: ReactLikeElementProps
}

type FlexDirection = 'column' | 'row';
type GridDirection = 'vertical' | 'horizontal';

interface CellFillRule {
  color: string,
  startingFrom: number
}

export interface GenerateConfigurations {
  fonts: Pick<SatoriOptions['fonts'][0], 'name' | 'weight'>[],
  dateOfBirth: number,
  filledCellColor: string,
  unfilledCellColor: string,
  direction: GridDirection,
  showTitle: boolean
}

const GRID_CELL_SIZE = 5;
const GRID_CELL_MARGIN = 1;

const NUMBER_OF_WEEKS_IN_YEAR = 52;

export default class CalendarGenerator {
  private fontLoader = new FontLoader();
  private isInitialized = false;

  // Constructor cannot be async, use initialize instead
  constructor() {}

  get availableFonts() {
    return this.fontLoader.availableFonts;
  }

  private generateCell(fillColor: string, width: number | string, height: number | string): ReactLikeElement {
    return {
      type: 'div',
      props: {
        style: {
          backgroundColor: fillColor,
          width,
          height,
          // marginLeft: GRID_CELL_MARGIN,
          // marginBottom: GRID_CELL_MARGIN,
          borderRadius: 1
        },
        children: ''
      }
    }
  }

  // Flexbox should allow more than 1 children, so we only accept array here
  private generateFlexbox(
    direction: FlexDirection,
    gap?: number | string,
    width?: number | string,
    height?: number | string,
    children: ReactLikeElement[] = []
  ): ReactLikeElement {
    return {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: direction,
          // Only add width, height and gap if it is supplied, an undefined value will lead to error in satori
          ...(width && { width }),
          ...(height && { height }),
          ...(gap && { gap })
        },
        children
      }
    }
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

  private generateGrid(
    size: number,
    direction: GridDirection,
    cellFillRules: CellFillRule[]
  ) {
    if (cellFillRules.length === 0) {
      throw Error('There must be at least one cell fill rule but found none');
    }

    if (!this.isValidCellFillRules(cellFillRules)) {
      throw Error(`Invalid cell fill rules: ${JSON.stringify(cellFillRules)}`);
    }

    const isHorizontal = direction === 'horizontal';
    const numberOfCellsHorizontally = isHorizontal ? size : NUMBER_OF_WEEKS_IN_YEAR;
    const numberOfCellsVertically = isHorizontal ? NUMBER_OF_WEEKS_IN_YEAR : size;

    const grid = this.generateFlexbox(
      isHorizontal ? 'row' : 'column',
      GRID_CELL_MARGIN,
      GRID_CELL_SIZE * numberOfCellsHorizontally + GRID_CELL_MARGIN * (numberOfCellsHorizontally - 1),
      GRID_CELL_SIZE * numberOfCellsVertically + GRID_CELL_MARGIN * (numberOfCellsVertically - 1)
    );

    let currentCellFillRuleIndex = 0;

    for (let i = 0; i < size; i++) {
      const line = this.generateFlexbox(
        isHorizontal ? 'column' : 'row',
        GRID_CELL_MARGIN
      );

      for (let j = 0; j < NUMBER_OF_WEEKS_IN_YEAR; j++) {
        const nextCellFillRule = cellFillRules[currentCellFillRuleIndex + 1];
        if (nextCellFillRule && nextCellFillRule.startingFrom === i * NUMBER_OF_WEEKS_IN_YEAR + j) {
          currentCellFillRuleIndex++;
        }

        const { color: fillColor } = cellFillRules[currentCellFillRuleIndex];
        const cell = this.generateCell(fillColor, GRID_CELL_SIZE, GRID_CELL_SIZE);

        (line.props.children as ReactLikeElement[]).push(cell);
      }

      (grid.props.children as ReactLikeElement[]).push(line);
    }

    return grid;
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

  public async generate({ dateOfBirth, direction, filledCellColor, unfilledCellColor, fonts }: GenerateConfigurations) {
    const loadedFonts = await Promise.all(
        fonts.map(async ({ name, weight = 400 }) => {
          return {
            name,
            data: await this.fontLoader.loadFont(name, weight.toString()),
            weight
          }
        })
    );

    const currentTime = new Date().getTime();
    const birthday = new Date(dateOfBirth).getTime();
    const difference = currentTime - birthday;
    const numberOfWeeksElapsed = Math.floor(difference / (7 * 24 * 60 * 60 * 1000)) + 1;

    const rawGeneratedSVG = await satori(
      {
        type: 'div',
        props: {
          style: {
            fontFamily: 'Inter',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: '#fff'
          },
          children: [
            this.generateGrid(
              100,
              direction,
              [
                { color: filledCellColor, startingFrom: 0 },
                { color: unfilledCellColor, startingFrom: numberOfWeeksElapsed }
              ]
            ),
          ]
        }
      },
      {
        width:  GRID_CELL_SIZE * 100 + GRID_CELL_MARGIN * (100 - 1),
        height: GRID_CELL_SIZE * 52 + GRID_CELL_MARGIN * (52 - 1),
        fonts: loadedFonts
      }
    );

    return rawGeneratedSVG
      .replace(/width="\d*"/, '')
      .replace(/height="\d*"/, '');
  }
}