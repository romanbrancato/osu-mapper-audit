export type Param = { weight: number, midpoint: number, steepness: number };

export const defaults: Record<string, Param> = {
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

export type Params = typeof defaults;

export function calculateScore(params: Params, mapperValues: Record<string, number>): {score: number, report: Record<string, string>} {
    let weightedSquaresSum = 0;
    let weightsSquaredSum = 0;

    const report: Record<string, string> = {}

    for (const key in params) {
        const param = params[key];

        if (param.weight > 0) {
            const raw = mapperValues[key] || 0;
            const scaled = 100 / (1 + Math.exp(-param.steepness * (raw - param.midpoint)));
            const weighted = scaled * param.weight;

            report[key] = `${raw} -> ${Math.ceil(scaled)} raw -> ${Math.ceil(weighted)} weighted`;

            weightedSquaresSum += weighted ** 2;
            weightsSquaredSum += param.weight ** 2;
        }
    }

    if (weightsSquaredSum === 0) return {score: 0, report}; // Prevent division by zero

    const denominator = Math.sqrt(weightsSquaredSum);
    const score = Math.sqrt(weightedSquaresSum) / denominator;

    return {score: Math.min(100, Math.max(0, Math.ceil(score))), report};
}




