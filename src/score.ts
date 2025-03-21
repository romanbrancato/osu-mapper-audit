type Parameter = {
    name: string;
    weight: number;
    scale: (value: number) => number;
};

export const parameters: Parameter[] = [
    {
        name: 'hasLeaderboardCount', // Exponential saturation
        weight: 1,
        scale: (maps: number) => {
            const steepness = 0.9; // 3 maps = 95 points
            const score = 100 * (1 - Math.exp(-steepness * maps));
            return Math.ceil(score);
        }
    },
    {
        name: 'graveyardCount', // Linear scaling
        weight: 1, 
        scale: (maps: number) => {
            return Math.max(0, maps);
        }
    },
    {
        name: 'graveyardFavorites', // Sigmoid scaling
        weight: 1,
        scale: (favorites: number) => {
            const midpoint = 100; // 0-50 favorites =< 1 point, 100 favorites = 50 points, 150+ favorites = 100 points
            const steepness = 0.1; // Higher = sharper increase
            return 100 / (1 + Math.exp(-steepness * (favorites - midpoint)));
        }
    },
    {
        name: 'kudosu', // Sigmoid scaling
        weight: 1,
        scale: (kudosu: number) => {
            const midpoint = 50; // 25 kudosu = 8 points, 50 kudosu = 50 points, 75+ kudosu = 92+ points
            const steepness = 0.1; // Higher = sharper increase
            return 100 / (1 + Math.exp(-steepness * (kudosu - midpoint)));
        }
    },
    {
        name: 'mappingSubs', // Sigmoid scaling
        weight: 1,
        scale: (subs: number) => {
            const midpoint = 15; // 5 subs = 5 points, 15 subs = 5 0 points, 25+ subs = 95+ points
            const steepness = 0.3; // Higher = sharper increase
            return 100 / (1 + Math.exp(-steepness * (subs - midpoint)));
        }
    },
    {
        name: 'globalRank', // Exponential decay: higher rank = lower score
        weight: 1,
        scale: (rank: number) => {
            const decayRate = 0.00005; // rank 10000 = 60 score
            const score = 100 * Math.exp(-decayRate * rank);
            return Math.ceil(score);
        }
    }
];
export function calculateScore(params: Parameter[], mapperValues: Record<string, number>): number {
    let weightedSquaresSum = 0;
    let weightsSquaredSum = 0;

    for (const param of params.filter(param => param.weight > 0)) {
        const rawValue = mapperValues[param.name] || 0;
        const scaledValue = Math.min(100, Math.max(0, param.scale(rawValue))); // Clamp 0-100
        console.log(`Score for ${rawValue} ${param.name}: ${scaledValue}`);
        const weightedValue = scaledValue * param.weight;

        weightedSquaresSum += weightedValue ** 2;
        weightsSquaredSum += param.weight ** 2;
    }

    if (weightsSquaredSum === 0) return 0; // Prevent division by zero

    const denominator = Math.sqrt(weightsSquaredSum);
    const score = Math.sqrt(weightedSquaresSum) / denominator;

    return Math.min(100, Math.max(0, score)); // Clamp 0-100
}



