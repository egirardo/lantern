export function rollDie(
  sides: number,
  random: () => number = Math.random,
): number {
  if (sides <= 0 || !Number.isInteger(sides)) {
    throw new Error(`Invalid number of sides: ${sides}`)
  }
  // Call random() once and keep the result: calling it twice would give two
  // different numbers, one for the check and one for the roll.
  const randomValue = random()
  // Written as "not in range" (instead of < 0 || >= 1) so NaN is rejected
  // too, since every comparison with NaN is false.
  if (!(randomValue >= 0 && randomValue < 1)) {
    throw new Error(`Invalid random value: ${randomValue}`)
  }
  // randomValue is from 0 up to (but not including) 1. Multiplying by sides
  // gives 0 up to sides, rounding down gives 0 to sides - 1, and + 1 shifts
  // that to the faces 1 to sides. Rounding down (not Math.round) gives every
  // face the same chance.
  return Math.floor(randomValue * sides) + 1
}
