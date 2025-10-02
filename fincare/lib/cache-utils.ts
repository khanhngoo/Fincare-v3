/**
 * Cache utilities for managing localStorage cached data
 */

export interface CachedData<T> {
  data: T
  timestamp: number
  applicationId?: string
}

const DEFAULT_CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

/**
 * Check if cached data is still valid based on timestamp
 */
export function isCacheValid(timestamp: number, maxAge: number = DEFAULT_CACHE_DURATION): boolean {
  const now = Date.now()
  return now - timestamp < maxAge
}

/**
 * Get cached loan options for a specific application
 */
export function getCachedLoanOptions(applicationId: string): any[] | null {
  if (typeof window === 'undefined') return null

  try {
    const cacheKey = `loanOptions_${applicationId}`
    const cachedString = localStorage.getItem(cacheKey)

    if (!cachedString) {
      return null
    }

    const cached: CachedData<any[]> = JSON.parse(cachedString)

    // Validate cache
    if (!isCacheValid(cached.timestamp)) {
      // Cache expired, remove it
      localStorage.removeItem(cacheKey)
      return null
    }

    console.log('Using cached loan options from:', new Date(cached.timestamp).toLocaleTimeString())
    return cached.data
  } catch (error) {
    console.error('Error reading cache:', error)
    return null
  }
}

/**
 * Store loan options in cache
 */
export function setCachedLoanOptions(applicationId: string, data: any[]): void {
  if (typeof window === 'undefined') return

  try {
    const cacheKey = `loanOptions_${applicationId}`
    const cachedData: CachedData<any[]> = {
      data,
      timestamp: Date.now(),
      applicationId,
    }

    localStorage.setItem(cacheKey, JSON.stringify(cachedData))
    console.log('Cached loan options for application:', applicationId)
  } catch (error) {
    console.error('Error setting cache:', error)
  }
}

/**
 * Clear cached loan options
 * If applicationId is provided, clear only that specific cache
 * Otherwise, clear all loan options caches
 */
export function clearLoanOptionsCache(applicationId?: string): void {
  if (typeof window === 'undefined') return

  try {
    if (applicationId) {
      // Clear specific application cache
      const cacheKey = `loanOptions_${applicationId}`
      localStorage.removeItem(cacheKey)
      console.log('Cleared cache for application:', applicationId)
    } else {
      // Clear all loan options caches
      const keys = Object.keys(localStorage)
      const loanOptionKeys = keys.filter(key => key.startsWith('loanOptions_'))

      loanOptionKeys.forEach(key => {
        localStorage.removeItem(key)
      })

      console.log('Cleared all loan options caches')
    }
  } catch (error) {
    console.error('Error clearing cache:', error)
  }
}

/**
 * Get cache age in minutes
 */
export function getCacheAge(applicationId: string): number | null {
  if (typeof window === 'undefined') return null

  try {
    const cacheKey = `loanOptions_${applicationId}`
    const cachedString = localStorage.getItem(cacheKey)

    if (!cachedString) {
      return null
    }

    const cached: CachedData<any[]> = JSON.parse(cachedString)
    const ageMs = Date.now() - cached.timestamp
    return Math.floor(ageMs / (60 * 1000)) // Convert to minutes
  } catch (error) {
    console.error('Error getting cache age:', error)
    return null
  }
}
