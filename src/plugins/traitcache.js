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
  if (trial.shareStatus === TRIAL_STATE_NOT_SHARED) {
    return
  }

  const traitsWithImages = trial.traits.filter(t => t.hasImage)

  for (const t of traitsWithImages) {
    updateTraitImageCache(trial, t.id)
  }
}

const updateTraitImageCache = async (trial, traitId) => {
  if (trial.shareStatus === TRIAL_STATE_NOT_SHARED) {
    return
  }

  let baseUrl = trial.remoteUrl || getStore().storeServerUrl

  if (!baseUrl.endsWith('/')) {
    baseUrl += '/'
  }
  if (!baseUrl.endsWith('api/')) {
    baseUrl += 'api/'
  }

  try {
    const cache = await caches.open('trait-images')

    const url = `${baseUrl}trait/${trial.shareCodes.ownerCode || trial.shareCodes.editorCode || trial.shareCodes.viewerCode}/${traitId}/img`
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

const ensureTraitImagesCached = async (trial) => {
  if (trial.shareStatus === TRIAL_STATE_NOT_SHARED) {
    return
  }

  const traitsWithImages = trial.traits.filter(t => t.hasImage)

  if (traitsWithImages && traitsWithImages.length > 0) {
    let baseUrl = trial.remoteUrl || getStore().storeServerUrl

    if (!baseUrl.endsWith('/')) {
      baseUrl += '/'
    }
    if (!baseUrl.endsWith('api/')) {
      baseUrl += 'api/'
    }

    const cache = await caches.open('trait-images')

    for (const t of traitsWithImages) {
      const url = `${baseUrl}trait/${trial.shareCodes.ownerCode || trial.shareCodes.editorCode || trial.shareCodes.viewerCode}/${t.id}/img`
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
  if (trial.shareStatus === TRIAL_STATE_NOT_SHARED) {
    return
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
      const url = `${baseUrl}trait/${trial.shareCodes.ownerCode || trial.shareCodes.editorCode || trial.shareCodes.viewerCode}/${traitId}/img`
      const match = await cache.match(url)

      if (match && match.ok) {
        // Delete the cached image
        await cache.delete(url)
      }
    }
  } catch (e) {
    console.error(e)
  }
}

const clearTrialImageCache = async (trial) => {
  if (trial.shareStatus === TRIAL_STATE_NOT_SHARED) {
    return
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
      if (k.url.includes('/api/trait/') && k.url.includes(trial.shareCodes.ownerCode || trial.shareCodes.editorCode || trial.shareCodes.viewerCode)) {
        await cache.delete(k)
      }
    }
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
