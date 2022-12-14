import { POOL_NO_LIQUIDITY } from '../modules/liquidityModule'
import Decimal from '../utils/decimal'
import { d } from '../utils/numbers'

export function withLiquiditySlippage(value: Decimal.Instance, slippage: Decimal.Instance, mode: 'plus' | 'minus') {
  return Decimal.floor(d(value)[mode](d(value).mul(slippage)))
}

export function getLiquidityAndCoinYByCoinX(
  coinInVal: Decimal.Instance,
  reserveInSize: Decimal.Instance,
  reserveOutSize: Decimal.Instance
) {
  if (coinInVal.lessThanOrEqualTo(0)) {
    throw new Error('coinInVal is less than zero')
  }

  if (reserveInSize.lessThanOrEqualTo(0) || reserveOutSize.lessThanOrEqualTo(0)) {
    return POOL_NO_LIQUIDITY
  }

  const coinYAmount = Decimal.floor(coinInVal.mul(reserveOutSize).div(reserveInSize))
  const sqrtSupply = reserveInSize.mul(reserveOutSize).sqrt()

  const lpX = coinInVal.div(reserveInSize).mul(sqrtSupply)
  const lpY = coinYAmount.div(reserveOutSize).mul(sqrtSupply)
  const lpAmount = Decimal.min(lpX, lpY)
  return {
    coinYAmount,
    lpAmount,
  }
}

export function getCoinXYForLiquidity(liquidity: Decimal.Instance, reserveInSize: Decimal.Instance, reserveOutSize: Decimal.Instance) {
  if (liquidity.lessThanOrEqualTo(0)) {
    throw new Error('liquidity is less than zero')
  }

  if (reserveInSize.lessThanOrEqualTo(0) || reserveOutSize.lessThanOrEqualTo(0)) {
    throw new Error("reserves can't be equal or less than zero")
  }

  const sqrtSupply = reserveInSize.mul(reserveOutSize).sqrt()
  const coinXAmount = liquidity.div(sqrtSupply).mul(reserveInSize)
  const coinYAmount = liquidity.div(sqrtSupply).mul(reserveOutSize)

  return {
    coinXAmount,
    coinYAmount,
  }
}
