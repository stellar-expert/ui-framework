import BigNumber from 'bignumber.js'

/**
 * Approximate the rational price and convert it to the standards Stellar n/d format.
 * @param {String|Number|BigNumber} src - Number to approximate
 * @returns {{n: Number, d: Number}}
 */
export function findFractionalApproximation(src, maxIterations = 50) {
    let real = new BigNumber(src),
        int,
        fract,
        i = 2,
        fractions = [[new BigNumber(0), new BigNumber(1)], [new BigNumber(1), new BigNumber(0)]]

    while (true) {
        if (real.gt(2147483647))
            break
        int = real.floor()
        fract = real.sub(int)
        const fractionN = int.mul(fractions[i - 1][0]).add(fractions[i - 2][0]),
            fractionD = int.mul(fractions[i - 1][1]).add(fractions[i - 2][1])
        if (fractionN.gt(2147483647) || fractionD.gt(2147483647))
            break
        fractions.push([fractionN, fractionD])
        if (fract.eq(0))
            break
        real = new BigNumber(1).div(fract)
        i += 1
    }
    const [n, d] = fractions[fractions.length - 1]

    if (n.isZero() || d.isZero())
        throw new Error('Failed to find approximation')

    return {n, d}
}