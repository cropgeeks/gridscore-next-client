import { coreStore } from '@/store'
import { TRIAL_STATE_NOT_SHARED } from '@/plugins/constants'

let store

const getStore = () => {
  if (!store) {
    store = coreStore()
  }
  return store
}

const forceUpdateTraitImageCache = async (trial) => {
  const traitsWithImages = trial.traits.filter(t => t.hasImage)

  for (const t of traitsWithImages) {
    updateTraitImageCache(trial, t.id)
  }
}

const updateTraitImageCache = async (trial, traitId) => {
  const traitsWithImages = trial.traits.filter(t => t.hasImage)
  const areExternal = traitsWithImages.filter(t => t.imageUrl)
  let toCheck = []

  if (trial.shareStatus === TRIAL_STATE_NOT_SHARED) {
    if (areExternal.length < 1) {
      return
    }

    toCheck = areExternal
  } else {
    toCheck = traitsWithImages
  }

  const trait = toCheck.find(t => t.id === traitId)

  if (trait) {
    let baseUrl = trial.remoteUrl || getStore().storeServerUrl

    if (!baseUrl.endsWith('/')) {
      baseUrl += '/'
    }
    if (!baseUrl.endsWith('api/')) {
      baseUrl += 'api/'
    }

    try {
      const cache = await caches.open('trait-images')
      const url = trait.imageUrl || `${baseUrl}trait/${trial.shareCodes.ownerCode || trial.shareCodes.editorCode || trial.shareCodes.viewerCode}/${traitId}/img`
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

const ensureTraitImagesCached = async (trial) => {
  const traitsWithImages = trial.traits.filter(t => t.hasImage)
  const areExternal = traitsWithImages.filter(t => t.imageUrl)
  let toCheck = []

  if (trial.shareStatus === TRIAL_STATE_NOT_SHARED) {
    if (areExternal.length < 1) {
      return
    }

    toCheck = areExternal
  } else {
    toCheck = traitsWithImages
  }

  if (toCheck && toCheck.length > 0) {
    let baseUrl = trial.remoteUrl || getStore().storeServerUrl

    if (!baseUrl.endsWith('/')) {
      baseUrl += '/'
    }
    if (!baseUrl.endsWith('api/')) {
      baseUrl += 'api/'
    }

    const cache = await caches.open('trait-images')

    for (const t of toCheck) {
      const url = t.imageUrl || `${baseUrl}trait/${trial.shareCodes.ownerCode || trial.shareCodes.editorCode || trial.shareCodes.viewerCode}/${t.id}/img`
      const match = await cache.match(url)

      if (match && match.ok) {
        // Do nothing, image is cached
      } else {
        await cache.add(url)
      }
    }
  }
}

const clearTraitImageCache = async (trial, traitIds) => {
  const traitsWithImages = trial.traits.filter(t => t.hasImage)
  const areExternal = traitsWithImages.filter(t => t.imageUrl)
  let toCheck = []

  if (trial.shareStatus === TRIAL_STATE_NOT_SHARED) {
    if (areExternal.length < 1) {
      return
    }

    toCheck = areExternal
  } else {
    toCheck = traitsWithImages
  }

  try {
    let baseUrl = trial.remoteUrl || getStore().storeServerUrl

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
        const url = trait.imageUrl || `${baseUrl}trait/${trial.shareCodes.ownerCode || trial.shareCodes.editorCode || trial.shareCodes.viewerCode}/${traitId}/img`
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

const clearTrialImageCache = async (trial) => {
  const traitsWithImages = trial.traits.filter(t => t.hasImage)
  const areExternal = traitsWithImages.filter(t => t.imageUrl)
  let toCheck = []

  if (trial.shareStatus === TRIAL_STATE_NOT_SHARED) {
    if (areExternal.length < 1) {
      return
    }

    toCheck = areExternal
  } else {
    toCheck = traitsWithImages
  }

  try {
    let baseUrl = trial.remoteUrl || getStore().storeServerUrl

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
      if (k.url.includes('/api/trait/') && k.url.includes(trial.shareCodes.ownerCode || trial.shareCodes.editorCode || trial.shareCodes.viewerCode)) {
        await cache.delete(k)
      }
    }

    // Delete those with external URLs
    toCheck.filter(t => t.imageUrl).forEach(t => cache.delete(t.imageUrl))
  } catch (e) {
    console.error(e)
  }
}

export {
  ensureTraitImagesCached,
  updateTraitImageCache,
  forceUpdateTraitImageCache,
  clearTraitImageCache,
  clearTrialImageCache
}
