export const DEFAULT_USD_TO_INR = 83.5

export function formatInrFromUsd(usd: number, usdToInr = DEFAULT_USD_TO_INR) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(usd * usdToInr))
}

export function convertUsdToInr(usd: number, usdToInr = DEFAULT_USD_TO_INR) {
  return Math.round(usd * usdToInr)
}
