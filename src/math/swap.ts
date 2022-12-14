import Decimal from '../utils/decimal'
import { d } from '../utils/numbers'

export function getCoinOutWithFees(
  coinInVal: Decimal.Instance,
  reserveInSize: Decimal.Instance,
  reserveOutSize: Decimal.Instance,
  feeDenominator: string,
  feeNumerator: string
) {
  const { feePct, feeScale } = { feePct: d(feeNumerator), feeScale: d(feeDenominator) }
  const feeMultiplier = feeScale.sub(feePct)
  const coinInAfterFees = coinInVal.mul(feeMultiplier)
  const newReservesInSize = reserveInSize.mul(feeScale).plus(coinInAfterFees)

  return Decimal.floor(coinInAfterFees.mul(reserveOutSize).div(newReservesInSize))
}

export function getCoinInWithFees(
  coinOutVal: Decimal.Instance,
  reserveOutSize: Decimal.Instance,
  reserveInSize: Decimal.Instance,
  feeDenominator: string,
  feeNumerator: string
) {
  const { feePct, feeScale } = { feePct: d(feeNumerator), feeScale: d(feeDenominator) }
  const feeMultiplier = feeScale.sub(feePct)
  const newReservesOutSize = reserveOutSize.sub(coinOutVal).mul(feeMultiplier)

  return Decimal.floor(coinOutVal.mul(feeScale).mul(reserveInSize).div(newReservesOutSize).plus(1))
}

export function withSlippage(value: Decimal.Instance, slippage: Decimal.Instance, mode: 'plus' | 'minus') {
  return d(value)[mode](d(value).mul(slippage)).toDP(0)
}
