import { Params } from './types';

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




