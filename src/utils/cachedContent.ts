import { AptosResource } from '../types/aptos'

export class CachedContent {
  overdueTime: number

  value: AptosResource | null

  constructor(value: AptosResource | null, overdueTime = 0) {
    this.overdueTime = overdueTime
    this.value = value
  }

  getCacheData(): AptosResource | null {
    if (this.value === null) {
      return null
    }
    if (this.overdueTime === 0) {
      return this.value
    }
    if (Date.parse(new Date().toString()) > this.overdueTime) {
      return null
    }
    return this.value
  }
}
