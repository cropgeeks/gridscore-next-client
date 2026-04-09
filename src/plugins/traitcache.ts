import { coreStore } from '@/stores/app'
import { ShareStatus, type TrialPlus } from '@/plugins/types/client'

async function forceUpdateTraitImageCache (trial: TrialPlus) {
  const traitsWithImages = trial.traits.filter(t => t.hasImage)

  for (const t of traitsWithImages) {
    updateTraitImageCache(trial, t.id || '')
  }
}

async function updateTraitImageCache (trial: TrialPlus, traitId: string) {
  const traitsWithImages = trial.traits.filter(t => t.hasImage)
  const areExternal = traitsWithImages.filter(t => t.imageUrl)
  let toCheck = []

  if (trial.shareStatus === ShareStatus.NOT_SHARED) {
    if (areExternal.length === 0) {
      return
    }

    toCheck = areExternal
  } else {
    toCheck = traitsWithImages
  }

  const trait = toCheck.find(t => t.id === traitId)

  if (trait) {
    const store = coreStore()
    let baseUrl = trial.remoteUrl || store.storeServerUrl || ''

    if (!baseUrl.endsWith('/')) {
      baseUrl += '/'
    }
    if (!baseUrl.endsWith('api/')) {
      baseUrl += 'api/'
    }

    try {
      const cache = await caches.open('trait-images')
      const url = trait.imageUrl || `${baseUrl}trait/${trial.shareCodes?.ownerCode || trial.shareCodes?.editorCode || trial.shareCodes?.viewerCode || ''}/${traitId}/img`
      const match = await cache.match(url)

      if (match && match.ok) {
        // Delete the cached image, then re-add
        await cache.delete(url)
        // Then re-add
        await cache.add(url)
      } else {
        await cache.add(url)
      }
    } catch (e) {
      console.error(e)
    }
  }
}

async function ensureTraitImagesCached (trial: TrialPlus) {
  const traitsWithImages = trial.traits.filter(t => t.hasImage)
  const areExternal = traitsWithImages.filter(t => t.imageUrl)
  let toCheck = []

  if (trial.shareStatus === ShareStatus.NOT_SHARED) {
    if (areExternal.length === 0) {
      return
    }

    toCheck = areExternal
  } else {
    toCheck = traitsWithImages
  }

  if (toCheck && toCheck.length > 0) {
    const store = coreStore()
    let baseUrl = trial.remoteUrl || store.storeServerUrl || ''

    if (!baseUrl.endsWith('/')) {
      baseUrl += '/'
    }
    if (!baseUrl.endsWith('api/')) {
      baseUrl += 'api/'
    }

    const cache = await caches.open('trait-images')

    for (const t of toCheck) {
      const url = t.imageUrl || `${baseUrl}trait/${trial.shareCodes?.ownerCode || trial.shareCodes?.editorCode || trial.shareCodes?.viewerCode || ''}/${t.id}/img`
      const match = await cache.match(url)

      if (match && match.ok) {
        // Do nothing, image is cached
      } else {
        await cache.add(url)
      }
    }
  }
}

async function clearTraitImageCache (trial: TrialPlus, traitIds: string[]) {
  const traitsWithImages = trial.traits.filter(t => t.hasImage)
  const areExternal = traitsWithImages.filter(t => t.imageUrl)
  let toCheck = []

  if (trial.shareStatus === ShareStatus.NOT_SHARED) {
    if (areExternal.length === 0) {
      return
    }

    toCheck = areExternal
  } else {
    toCheck = traitsWithImages
  }

  try {
    const store = coreStore()
    let baseUrl = trial.remoteUrl || store.storeServerUrl || ''

    if (!baseUrl.endsWith('/')) {
      baseUrl += '/'
    }
    if (!baseUrl.endsWith('api/')) {
      baseUrl += 'api/'
    }

    const cache = await caches.open('trait-images')

    for (const traitId of traitIds) {
      const trait = toCheck.find(t => t.id === traitId)
      if (trait) {
        const url = trait.imageUrl || `${baseUrl}trait/${trial.shareCodes?.ownerCode || trial.shareCodes?.editorCode || trial.shareCodes?.viewerCode || ''}/${traitId}/img`
        const match = await cache.match(url)

        if (match && match.ok) {
          // Delete the cached image
          await cache.delete(url)
        }
      }
    }
  } catch (e) {
    console.error(e)
  }
}

async function clearTrialImageCache (trial: TrialPlus) {
  const traitsWithImages = trial.traits.filter(t => t.hasImage)
  const areExternal = traitsWithImages.filter(t => t.imageUrl)
  let toCheck = []

  if (trial.shareStatus === ShareStatus.NOT_SHARED) {
    if (areExternal.length === 0) {
      return
    }

    toCheck = areExternal
  } else {
    toCheck = traitsWithImages
  }

  try {
    const store = coreStore()
    let baseUrl = trial.remoteUrl || store.storeServerUrl || ''

    if (!baseUrl.endsWith('/')) {
      baseUrl += '/'
    }
    if (!baseUrl.endsWith('api/')) {
      baseUrl += 'api/'
    }

    const cache = await caches.open('trait-images')
    const keys = await cache.keys()

    for (const k of keys) {
      // Delete any GridScore specific URLs
      if (k.url.includes('/api/trait/') && k.url.includes(trial.shareCodes?.ownerCode || trial.shareCodes?.editorCode || trial.shareCodes?.viewerCode || '')) {
        await cache.delete(k)
      }
    }

    // Delete those with external URLs
    toCheck.filter(t => t.imageUrl).forEach(t => cache.delete(t.imageUrl || ''))
  } catch (e) {
    console.error(e)
  }
}

export {
  ensureTraitImagesCached,
  updateTraitImageCache,
  forceUpdateTraitImageCache,
  clearTraitImageCache,
  clearTrialImageCache,
}
