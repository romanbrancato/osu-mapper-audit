type Parameter = {
    name: string;
    weight: number;
    midpoint: number;
    steepness: number;
};

export const parameters: Parameter[] = [
    {
        name: 'hasLeaderboardCount',
        weight: 1,
        midpoint: 2,
        steepness: 0.3,
    },
    {
       name: 'averageGraveyardPlayCount',
        weight: 1,
        midpoint: 100,
        steepness: 0.1,
    },
    {
        name: 'graveyardCount',
        weight: 1, 
        midpoint: 10,
        steepness: 0.3,
    },
    {
        name: 'graveyardFavorites',
        weight: 1,
        midpoint: 100,
        steepness: 0.1,
    },
    {
        name: 'kudosu',
        weight: 1,
        midpoint: 50,
        steepness: 0.1
    },
    {
        name: 'mappingSubs',
        weight: 1,
        midpoint: 50,
        steepness: 0.1
    },
    {
        name: 'pp',
        weight: 1,
        midpoint: 8000,
        steepness: 0.01
    }
];
export function calculateScore(params: Parameter[], mapperValues: Record<string, number>): {score: number, report: Record<string, string>} {
    let weightedSquaresSum = 0;
    let weightsSquaredSum = 0;

    const report: Record<string, string> = {}

    for (const param of params.filter(param => param.weight > 0)) {
        const raw = mapperValues[param.name] || 0;
        const scaled = 100 / (1 + Math.exp(-param.steepness * (raw - param.midpoint)));
        const weighted = scaled * param.weight;

        report[param.name] = `${raw} -> ${Math.ceil(scaled)} raw -> ${Math.ceil(weighted)} weighted`;

        weightedSquaresSum += weighted ** 2;
        weightsSquaredSum += param.weight ** 2;
    }

    if (weightsSquaredSum === 0) return {score: 0, report}; // Prevent division by zero

    const denominator = Math.sqrt(weightsSquaredSum);
    const score = Math.sqrt(weightedSquaresSum) / denominator;

    return {score: Math.min(100, Math.max(0, Math.ceil(score))), report};
}



