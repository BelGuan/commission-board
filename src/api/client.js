import { ApiError, http, setToken, clearToken, getToken } from '../lib/http'
import {
  fromPreferences,
  toArtist,
  toCommission,
  toOffering,
  toPage,
  toPreferences,
  toReview,
  toSavedArtist,
  toUser,
  toUserReputation,
} from './mappers'

const userIdByArtistId = new Map()

function rememberArtist(artist) {
  if (artist?.id && artist?.userId) userIdByArtistId.set(artist.id, artist.userId)
  return artist
}

function artistQuery({
  styles = [],
  contentTags = [],
  commissionTypes = [],
  priceMin = null,
  priceMax = null,
  turnaroundMaxDays = null,
  openOnly = false,
  query = '',
  sort = 'recommended',
  page = 1,
  pageSize = 12,
  includeRestricted = false,
} = {}) {
  return {
    styles,
    content_tags: contentTags,
    commission_types: commissionTypes,
    price_min: priceMin,
    price_max: priceMax,
    max_turnaround_days: turnaroundMaxDays,
    open_only: openOnly,
    q: query,
    sort,
    page,
    page_size: pageSize,
    include_restricted: includeRestricted,
  }
}

export async function listArtists(params = {}) {
  const payload = await http.get('/api/artists', { params: artistQuery(params) })
  const page = toPage(payload, (a) => rememberArtist(toArtist(a)))

  return { ...page, blockingFilters: page.total === 0 ? await diagnose(params) : [] }
}

const FACETS = [
  ['styles', { styles: [] }],
  ['contentTags', { contentTags: [] }],
  ['commissionTypes', { commissionTypes: [] }],
  ['price', { priceMin: null, priceMax: null }],
  ['turnaround', { turnaroundMaxDays: null }],
  ['openOnly', { openOnly: false }],
  ['query', { query: '' }],
]

function isActive(key, p) {
  if (key === 'price') return p.priceMin != null || p.priceMax != null
  if (key === 'turnaround') return p.turnaroundMaxDays != null
  if (key === 'openOnly') return Boolean(p.openOnly)
  if (key === 'query') return Boolean(String(p.query ?? '').trim())
  return (p[key] ?? []).length > 0
}

async function diagnose(params) {
  const active = FACETS.filter(([key]) => isActive(key, params))
  if (!active.length) return []

  const probes = await Promise.all(
    active.map(async ([key, relaxed]) => {
      try {
        const result = await http.get('/api/artists', {
          params: artistQuery({ ...params, ...relaxed, page: 1, pageSize: 1 }),
        })
        return { key, unlocks: result.total ?? 0 }
      } catch {
        return { key, unlocks: 0 }
      }
    }),
  )

  return probes.filter((p) => p.unlocks > 0).sort((a, b) => b.unlocks - a.unlocks).slice(0, 3)
}

const offeringsCache = new Map()

export async function getArtist(handle, { includeRestricted = false } = {}) {
  const payload = await http.get(`/api/artists/${encodeURIComponent(handle)}`, {
    params: { include_restricted: includeRestricted },
  })
  const artist = rememberArtist(toArtist(payload))
  offeringsCache.set(artist.id, (payload.offerings ?? []).map(toOffering))
  return artist
}

export async function getArtistOfferings(artistId) {
  return offeringsCache.get(artistId) ?? []
}

export async function listReviews({ subjectId, subjectType = 'artist', page = 1 } = {}) {
  const subjectUserId = userIdByArtistId.get(subjectId) ?? subjectId
  const payload = await http.get('/api/reviews', {
    params: {
      subject_user_id: subjectUserId,
      subject_type: subjectType,
      page,
      page_size: 10,
    },
  })
  return {
    ...toPage(payload, toReview),
    distribution: payload.distribution ?? [],
    average: payload.average ?? 0,
  }
}

export async function createReview(payload = {}) {
  const body = {
    subject_user_id: userIdByArtistId.get(payload.subjectId) ?? payload.subjectId,
    subject_type: payload.subjectType ?? 'artist',
    commission_id: payload.commissionId ?? null,
    rating: payload.rating,
    body: payload.body,
    sub_ratings: payload.subRatings ?? {},
    would_work_again: payload.wouldWorkAgain ?? null,
  }
  return toReview(await http.post('/api/reviews', body))
}

export const deleteReview = (id) => http.delete(`/api/reviews/${id}`)

export const getUserReputation = async (username) =>
  toUserReputation(await http.get(`/api/users/${encodeURIComponent(username)}`))

export async function getCurrentUser() {
  if (!getToken()) return null
  try {
    return toUser(await http.get('/api/auth/me'))
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export async function login({ email, password }) {
  const payload = await http.post('/api/auth/login', { email, password }, { auth: false })
  setToken(payload.access_token)
  return { user: toUser(payload.user), token: payload.access_token }
}

export async function register(payload = {}) {
  const body = {
    email: payload.email,
    username: payload.username,
    password: payload.password,
    display_name: payload.displayName ?? payload.username,
    is_artist: Boolean(payload.isArtist),
  }
  const result = await http.post('/api/auth/register', body, { auth: false })
  setToken(result.access_token)
  return { user: toUser(result.user), token: result.access_token }
}

export async function logout() {
  try {
    await http.post('/api/auth/logout')
  } catch {

  }
  clearToken()
}

export const updateMe = async (patch = {}) => {
  const body = {}
  if (patch.displayName !== undefined) body.display_name = patch.displayName
  if (patch.bio !== undefined) body.bio = patch.bio
  if (patch.avatarUrl !== undefined) body.avatar_url = patch.avatarUrl
  if (patch.ageVerified !== undefined) body.age_verified = patch.ageVerified
  return toUser(await http.patch('/api/auth/me', body))
}

export const getMyPreferences = async () =>
  toPreferences(await http.get('/api/me/preferences'))

export const updateMyPreferences = async (prefs = {}) =>
  toPreferences(await http.put('/api/me/preferences', fromPreferences(prefs)))

export const listSavedArtists = async ({ page = 1 } = {}) =>
  toPage(await http.get('/api/me/saved-artists', { params: { page } }), toSavedArtist)

export const saveArtist = async (handle) =>
  toSavedArtist(await http.post('/api/me/saved-artists', { artist_handle: handle }))

export const unsaveArtist = (handle) =>
  http.delete(`/api/me/saved-artists/${encodeURIComponent(handle)}`)

export const createCommission = async (payload = {}) =>
  toCommission(
    await http.post('/api/commissions', {
      artist_handle: payload.artistHandle,
      offering_id: payload.offeringId ?? null,
      title: payload.title,
      message: payload.message ?? null,
      proposed_price: payload.proposedPrice ?? null,
    }),
  )

export const listCommissions = async ({ role = 'any', status, page = 1 } = {}) =>
  toPage(
    await http.get('/api/commissions', { params: { role, status, page, page_size: 20 } }),
    toCommission,
  )

export const updateCommissionStatus = async (id, status, agreedPrice) =>
  toCommission(
    await http.patch(`/api/commissions/${id}/status`, {
      status,
      agreed_price: agreedPrice ?? null,
    }),
  )

export async function upsertMyArtistProfile(payload = {}) {
  const body = {
    handle: payload.handle,
    tagline: payload.tagline ?? null,
    bio: payload.bio ?? null,
    banner_url: payload.bannerUrl ?? null,
    location: payload.location ?? null,
    languages: payload.languages ?? [],
    terms_of_service: payload.termsOfService ?? null,
    is_open: payload.isOpen ?? true,
    slots_open: payload.slotsOpen ?? 0,
    slots_total: payload.slotsTotal ?? 0,
    turnaround_days: payload.turnaroundDays ?? 14,
    price_min: payload.priceMin ?? 0,
    price_max: payload.priceMax ?? 0,
    currency: payload.currency ?? 'USD',
    tag_slugs: payload.tagSlugs ?? [],
  }
  return http.put('/api/artists/me', body)
}

const offeringBody = (p = {}) => {
  const body = {}
  if (p.type !== undefined) body.commission_type = p.type
  if (p.title !== undefined) body.title = p.title
  if (p.description !== undefined) body.description = p.description
  if (p.priceFrom !== undefined) body.price = p.priceFrom
  if (p.turnaroundDays !== undefined) body.delivery_days = p.turnaroundDays
  if (p.revisions !== undefined) body.revisions = p.revisions
  if (p.thumbnailUrl !== undefined) body.example_image_url = p.thumbnailUrl
  if (p.sortOrder !== undefined) body.sort_order = p.sortOrder
  return body
}

export const createOffering = async (payload = {}) =>
  toOffering(await http.post('/api/artists/me/offerings', offeringBody(payload)))

export const updateOffering = async (id, payload = {}) =>
  toOffering(await http.patch(`/api/artists/me/offerings/${id}`, offeringBody(payload)))

export const deleteOffering = (id) => http.delete(`/api/artists/me/offerings/${id}`)

export const reorderOfferings = async (ids) =>
  (await http.put('/api/artists/me/offerings/reorder', { ids })).map(toOffering)

const imagePath = (kind) => (kind === 'sheet' ? 'sheet-images' : 'portfolio-images')

export const addArtistImage = (kind, { url, caption, isRestricted = false, sortOrder = 0 }) =>
  http.post(`/api/artists/me/${imagePath(kind)}`, {
    url,
    caption: caption ?? null,
    is_restricted: isRestricted,
    sort_order: sortOrder,
  })

export const deleteArtistImage = (kind, id) =>
  http.delete(`/api/artists/me/${imagePath(kind)}/${id}`)

export const reorderArtistImages = (kind, ids) =>
  http.put(`/api/artists/me/${imagePath(kind)}/reorder`, { ids })

export async function uploadImage(file) {
  const form = new FormData()
  form.append('file', file)
  const result = await http.post('/api/uploads', form)
  return { url: result.url, filename: result.filename, size: result.size }
}

export const listTags = () => http.get('/api/tags', { auth: false })

export { ApiError }

export default {
  listArtists, getArtist, getArtistOfferings,
  listReviews, createReview, deleteReview, getUserReputation,
  getCurrentUser, login, register, logout, updateMe,
  getMyPreferences, updateMyPreferences,
  listSavedArtists, saveArtist, unsaveArtist,
  createCommission, listCommissions, updateCommissionStatus,
  upsertMyArtistProfile, createOffering, updateOffering, deleteOffering, reorderOfferings,
  addArtistImage, deleteArtistImage, reorderArtistImages,
  uploadImage, listTags,
}
