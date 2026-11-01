function loadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}

/** Preload URLs with a small concurrency pool (stable progress + browser-friendly). */
export async function preloadImages(
  urls: string[],
  options?: {
    concurrency?: number
    onProgress?: (loaded: number, total: number) => void
  },
): Promise<void> {
  const total = urls.length
  if (total === 0) {
    options?.onProgress?.(0, 0)
    return
  }

  const concurrency = Math.max(1, options?.concurrency ?? 10)
  let loaded = 0
  let index = 0

  const tick = () => {
    loaded += 1
    options?.onProgress?.(loaded, total)
  }

  async function worker() {
    while (index < total) {
      const i = index
      index += 1
      await loadImage(urls[i]!)
      tick()
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker())
  await Promise.all(workers)
}
