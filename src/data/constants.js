export const ART_STYLES = [
  { id: 'anime', label: 'Anime' },
  { id: 'semi_realism', label: 'Semi-realism' },
  { id: 'realism', label: 'Realism' },
  { id: 'cartoon', label: 'Cartoon' },
  { id: 'chibi', label: 'Chibi' },
  { id: 'pixel_art', label: 'Pixel art' },
  { id: 'painterly', label: 'Painterly' },
  { id: 'lineart', label: 'Lineart' },
  { id: 'sketch', label: 'Sketch' },
  { id: '3d_render', label: '3D render' },
  { id: 'comic', label: 'Comic' },
]

export const CONTENT_TAGS = [
  {
    id: 'oc_friendly',
    label: 'OC friendly',
    description: 'Happily draws original characters from your references.',
    restricted: false,
  },
  {
    id: 'fanart',
    label: 'Fanart',
    description: 'Takes commissions of existing published characters.',
    restricted: false,
  },
  {
    id: 'furry',
    label: 'Furry',
    description: 'Non-human and fursona characters.',
    restricted: false,
  },
  {
    id: 'anthro',
    label: 'Anthro',
    description: 'Anthropomorphic body types and animal features.',
    restricted: false,
  },
  {
    id: 'mecha',
    label: 'Mecha',
    description: 'Hard-surface robots, suits and vehicles.',
    restricted: false,
  },
  {
    id: 'horror',
    label: 'Horror',
    description: 'Unsettling themes, creature design, body horror-adjacent.',
    restricted: false,
  },
  {
    id: 'gore',
    label: 'Gore',
    description: 'Graphic blood and injury. Hidden unless explicitly enabled.',
    restricted: true,
  },
  {
    id: 'nsfw_18plus',
    label: 'NSFW (18+)',
    description: 'Adult content. Hidden unless explicitly enabled.',
    restricted: true,
  },
  {
    id: 'pet_portrait',
    label: 'Pet portrait',
    description: 'Real animals drawn from photographs.',
    restricted: false,
  },
  {
    id: 'ref_sheet',
    label: 'Reference sheet',
    description: 'Full turnaround sheets with palettes and callouts.',
    restricted: false,
  },
  {
    id: 'chibi_style',
    label: 'Chibi style',
    description: 'Small, rounded, exaggerated proportions.',
    restricted: false,
  },
  {
    id: 'landscape',
    label: 'Landscape',
    description: 'Environments, backgrounds and scenery.',
    restricted: false,
  },
  {
    id: 'tattoo_design',
    label: 'Tattoo design',
    description: 'Artwork prepared for tattooing, with stencil-ready lines.',
    restricted: false,
  },
  {
    id: 'emotes_vtuber',
    label: 'Emotes & VTuber',
    description: 'Twitch/Discord emotes, badges and model assets.',
    restricted: false,
  },
]

export const COMMISSION_TYPES = [
  { id: 'bust', label: 'Bust' },
  { id: 'half_body', label: 'Half body' },
  { id: 'full_body', label: 'Full body' },
  { id: 'ref_sheet', label: 'Reference sheet' },
  { id: 'illustration', label: 'Illustration' },
  { id: 'emote_set', label: 'Emote set' },
  { id: 'icon', label: 'Icon' },
  { id: 'animation', label: 'Animation' },
  { id: 'character_design', label: 'Character design' },
]

export const PRICE_BRACKETS = [
  { id: 'under_25', label: 'Under $25', min: 0, max: 25 },
  { id: '25_75', label: '$25 – $75', min: 25, max: 75 },
  { id: '75_150', label: '$75 – $150', min: 75, max: 150 },
  { id: '150_300', label: '$150 – $300', min: 150, max: 300 },
  { id: '300_plus', label: '$300+', min: 300, max: null },
]

export const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'rating', label: 'Highest rated' },
  { id: 'price_low', label: 'Price: low to high' },
  { id: 'price_high', label: 'Price: high to low' },
  { id: 'newest', label: 'Newest artists' },
]

export const RESTRICTED_TAG_IDS = CONTENT_TAGS.filter((t) => t.restricted).map((t) => t.id)

const index = (list) => Object.fromEntries(list.map((item) => [item.id, item]))

export const ART_STYLE_BY_ID = index(ART_STYLES)
export const CONTENT_TAG_BY_ID = index(CONTENT_TAGS)
export const COMMISSION_TYPE_BY_ID = index(COMMISSION_TYPES)
export const PRICE_BRACKET_BY_ID = index(PRICE_BRACKETS)

export const styleLabel = (id) => ART_STYLE_BY_ID[id]?.label ?? id
export const contentTagLabel = (id) => CONTENT_TAG_BY_ID[id]?.label ?? id
export const commissionTypeLabel = (id) => COMMISSION_TYPE_BY_ID[id]?.label ?? id
export const isRestrictedTag = (id) => Boolean(CONTENT_TAG_BY_ID[id]?.restricted)

export const TURNAROUND_OPTIONS = [
  { id: 'any', label: 'Any', maxDays: null },
  { id: 'under_1_week', label: 'Under 1 week', maxDays: 7 },
  { id: 'under_2_weeks', label: 'Under 2 weeks', maxDays: 14 },
  { id: 'under_1_month', label: 'Under 1 month', maxDays: 30 },
]

export const TURNAROUND_BY_ID = index(TURNAROUND_OPTIONS)
export const turnaroundLabel = (id) => TURNAROUND_BY_ID[id]?.label ?? id
export const turnaroundMaxDays = (id) => TURNAROUND_BY_ID[id]?.maxDays ?? null
export const turnaroundIdForMaxDays = (maxDays) =>
  TURNAROUND_OPTIONS.find((o) => o.maxDays === maxDays)?.id ?? 'any'

export const PRICE_FLOOR = 0
export const PRICE_CEILING = 1600
export const PRICE_STEP = 5

const rebuildIndex = (target, list) => {
  Object.keys(target).forEach((key) => delete target[key])
  list.forEach((item) => {
    target[item.id] = item
  })
}

const replaceAll = (target, next) => {
  target.length = 0
  target.push(...next)
}

export function hydrateVocabulary(payload) {
  if (!payload) return false

  const asOption = (tag) => ({
    id: tag.slug,
    label: tag.label,
    description: tag.description ?? undefined,
    restricted: Boolean(tag.is_restricted),
  })

  if (payload.styles?.length) {
    replaceAll(ART_STYLES, payload.styles.map(asOption))
    rebuildIndex(ART_STYLE_BY_ID, ART_STYLES)
  }
  if (payload.content_tags?.length) {
    replaceAll(CONTENT_TAGS, payload.content_tags.map(asOption))
    rebuildIndex(CONTENT_TAG_BY_ID, CONTENT_TAGS)
    replaceAll(
      RESTRICTED_TAG_IDS,
      CONTENT_TAGS.filter((t) => t.restricted).map((t) => t.id),
    )
  }
  if (payload.commission_types?.length) {
    replaceAll(COMMISSION_TYPES, payload.commission_types.map(asOption))
    rebuildIndex(COMMISSION_TYPE_BY_ID, COMMISSION_TYPES)
  }
  return true
}
