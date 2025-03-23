export type Param = { weight: number; midpoint: number; steepness: number };

export const defaultParams: Record<string, Param> = {
  hasLeaderboardCount: {
    weight: 1,
    midpoint: 2,
    steepness: 0.3,
  },
  averageGraveyardPlayCount: {
    weight: 1,
    midpoint: 100,
    steepness: 0.1,
  },
  graveyardCount: {
    weight: 1,
    midpoint: 10,
    steepness: 0.3,
  },
  graveyardFavorites: {
    weight: 1,
    midpoint: 100,
    steepness: 0.1,
  },
  kudosu: {
    weight: 1,
    midpoint: 50,
    steepness: 0.1,
  },
  mappingSubscribers: {
    weight: 1,
    midpoint: 50,
    steepness: 0.1,
  },
  pp: {
    weight: 1,
    midpoint: 8000,
    steepness: 0.01,
  },
};

export type Params = typeof defaultParams;

export type OAuth = { clientId: string; clientSecret: string };

export const defaultColors = {
  0: [0, 0, 0],
  33: [255, 0, 0],
  66: [255, 255, 0],
  100: [0, 255, 0],
};

export type Colors = typeof defaultColors;

export type Display = {
  colors: Colors;
  showScore: boolean;
};
