type Parameter = {
    name: string;
    weight: number;
    scale: (value: number) => number;
};

const parameters: Parameter[] = [
    {
        name: 'hasLeaderboardCount', // Exponential saturation: strong early boost
        weight: 5,
        scale: (maps: number) => {
            const steepness = 3.0; // Higher steepness = stronger early emphasis

            const score = 100 * (1 - Math.exp(-steepness * maps));

            return Math.min(Math.ceil(score), 100);
        }
    },
    {
        name: 'graveyardCount', // linear scaling: more graveyard maps = more experience
        weight: 2,
        scale: (maps: number) => {
            const score = Math.max(0, maps);
            return Math.min(score, 100);
        }
    },
    {
        name: 'graveyardFavorites', // sigmoid scaling
        weight: 5,
        scale: (favorites: number) => {
            const midpoint = 100; // Define where the score starts increasing significantly
            const steepness = 0.1; // Controls how sharp the increase is

            const score = 100 / (1 + Math.exp(-steepness * (favorites - midpoint)));

            return Math.min(100, score);
        }
    },
    {
        name: 'kudosu', // sigmoid scaling
        weight: 2,
        scale: (kudosu: number) => {
            const midpoint = 50; // Define where the score starts increasing significantly
            const steepness = 0.1; // Controls how sharp the increase is

            const score = 100 / (1 + Math.exp(-steepness * (kudosu - midpoint)));

            return Math.min(100, score);
        }
    },
    {
        name: 'mappingSubs', // sigmoid scaling
        weight: 2,
        scale: (subs: number) => {
            const midpoint = 25; // Define where the score starts increasing significantly
            const steepness = 0.1; // Controls how sharp the increase is

            const score = 100 / (1 + Math.exp(-steepness * (subs - midpoint)));

            return Math.min(100, score);
        }
    },
    {
        name: 'globalRank', // Exponential decay: higher rank = lower score
        weight: 1,
        scale: (rank: number) => {
            const decayRate = 0.0005; // Lower = more score for bigger range of high ranks

            const score = 100 * Math.exp(-decayRate * rank);

            return Math.min(Math.ceil(score), 100);
        }
    }
];

export function calculateScore(params: Parameter[], mapperValues: Record<string, number>): number {
    let weightedSquaresSum = 0;
    let weightsSquaredSum = 0;

    for (const param of params.filter(param => param.weight > 0)) {
        const rawValue = mapperValues[param.name] || 0;
        const scaledValue = Math.min(100, Math.max(0, param.scale(rawValue))); // Clamp 0-100
        const weightedValue = scaledValue * param.weight;

        weightedSquaresSum += weightedValue ** 2;
        weightsSquaredSum += param.weight ** 2;
    }

    if (weightsSquaredSum === 0) return 0; // Prevent division by zero

    const denominator = Math.sqrt(weightsSquaredSum);
    const score = Math.sqrt(weightedSquaresSum) / denominator;

    return Math.min(100, Math.max(0, score));
}

