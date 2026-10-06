const num = (value) => (value == null ? null : Number(value))

export function toArtist(a) {
  if (!a) return null
  return {
    id: a.id,
    userId: a.user_id,
    handle: a.handle,
    displayName: a.display_name,
    avatarUrl: a.avatar_url,
    bannerUrl: a.banner_url,
    bio: a.bio ?? a.tagline ?? '',
    tagline: a.tagline,
    location: a.location,
    languages: a.languages ?? [],

    styles: a.styles ?? [],
    contentTags: a.content_tags ?? [],
    commissionTypes: a.commission_types ?? [],

    refusedTags: [],

    priceMin: num(a.price_min),
    priceMax: num(a.price_max),
    currency: a.currency ?? 'USD',

    isOpen: Boolean(a.is_open),
    slotsOpen: a.slots_open ?? 0,
    slotsTotal: a.slots_total ?? 0,
    turnaroundDays: a.turnaround_days ?? 0,

    rating: num(a.rating_avg) ?? 0,
    reviewCount: a.review_count ?? 0,
    completedCommissions: a.completed_commissions ?? 0,

    sheetImages: a.sheet_images ?? [],
    portfolioImages: a.portfolio_images ?? [],
    termsOfService: a.terms_of_service ?? '',

    joinedAt: a.joined_at,
    lastActiveAt: a.last_active_at,
    hasRestrictedContent: Boolean(a.has_restricted_content),

    sheetImageDetails: (a.sheet_image_details ?? []).map(toImage),
    portfolioImageDetails: (a.portfolio_image_details ?? []).map(toImage),
    ratingDistribution: a.rating_distribution ?? [],
  }
}

export const toImage = (i) => ({
  id: i.id,
  artistId: i.artist_id,
  url: i.url,
  caption: i.caption,
  sortOrder: i.sort_order,
  isRestricted: Boolean(i.is_restricted),
})

export const toOffering = (o) => ({
  id: o.id,
  artistId: o.artist_id,
  type: o.commission_type,
  title: o.title,
  description: o.description,
  addOns: null,
  priceFrom: num(o.price),
  priceTo: null,
  currency: 'USD',
  turnaroundDays: o.delivery_days,
  revisions: o.revisions ?? 1,
  thumbnailUrl: o.example_image_url,
  isActive: true,
  sortOrder: o.sort_order ?? 0,
})

export const toReview = (r) => ({
  id: r.id,
  subjectId: r.subject_user_id,
  subjectType: r.subject_type,
  authorId: r.author?.id,
  authorName: r.author?.display_name ?? r.author?.username ?? 'Someone',
  authorAvatarUrl: r.author?.avatar_url,
  rating: r.rating,
  body: r.body,
  subRatings: r.sub_ratings ?? {},
  wouldWorkAgain: r.would_work_again,

  commissionType: undefined,
  verified: Boolean(r.verified),
  createdAt: r.created_at,
})

export const toUser = (u) =>
  u
    ? {
        id: u.id,
        email: u.email,
        username: u.username,
        displayName: u.display_name,
        avatarUrl: u.avatar_url,
        bio: u.bio,
        isArtist: Boolean(u.is_artist),
        isAdmin: Boolean(u.is_admin),
        ageVerified: Boolean(u.age_verified),
        createdAt: u.created_at,
        lastActiveAt: u.last_active_at,
        artistProfile: u.artist_profile ? toArtistProfile(u.artist_profile) : null,
      }
    : null

export const toArtistProfile = (p) => ({
  id: p.id,
  userId: p.user_id,
  handle: p.handle,
  tagline: p.tagline,
  bannerUrl: p.banner_url,
  location: p.location,
  languages: p.languages ?? [],
  termsOfService: p.terms_of_service,
  isOpen: Boolean(p.is_open),
  slotsOpen: p.slots_open,
  slotsTotal: p.slots_total,
  turnaroundDays: p.turnaround_days,
  priceMin: num(p.price_min),
  priceMax: num(p.price_max),
  currency: p.currency,
  completedCommissions: p.completed_commissions,
  rating: num(p.rating_avg),
  reviewCount: p.review_count,
})

export const toPreferences = (p) => ({
  styles: p.preferred_style_tags ?? [],
  contentTags: p.preferred_content_tags ?? [],
  excludedContentTags: p.excluded_content_tags ?? [],
  commissionTypes: p.preferred_commission_types ?? [],
  priceMin: num(p.budget_min),
  priceMax: num(p.budget_max),
  showRestricted: Boolean(p.show_restricted),
  openOnly: false,
  locale: 'en',
})

export const fromPreferences = (p = {}) => {
  const out = {}
  if (p.styles !== undefined) out.preferred_style_tags = p.styles
  if (p.contentTags !== undefined) out.preferred_content_tags = p.contentTags
  if (p.excludedContentTags !== undefined) out.excluded_content_tags = p.excludedContentTags
  if (p.commissionTypes !== undefined) out.preferred_commission_types = p.commissionTypes
  if (p.priceMin !== undefined) out.budget_min = p.priceMin
  if (p.priceMax !== undefined) out.budget_max = p.priceMax
  if (p.showRestricted !== undefined) out.show_restricted = p.showRestricted
  return out
}

export const toCommission = (c) => ({
  id: c.id,
  artistId: c.artist_id,
  artistHandle: c.artist_handle,
  clientId: c.client_id,
  offeringId: c.offering_id,
  title: c.title,
  brief: c.brief,
  status: c.status,
  agreedPrice: num(c.agreed_price),
  requestedAt: c.requested_at,
  completedAt: c.completed_at,
  createdAt: c.created_at,
  artistUser: c.artist_user ? toUser(c.artist_user) : null,
  client: c.client ? toUser(c.client) : null,
  reviewedByMe: Boolean(c.reviewed_by_me),
})

export const toSavedArtist = (s) => ({
  id: s.id,
  artistId: s.artist_id,
  handle: s.handle,
  displayName: s.display_name,
  avatarUrl: s.avatar_url,
  priceMin: num(s.price_min),
  priceMax: num(s.price_max),
  isOpen: Boolean(s.is_open),
  rating: num(s.rating_avg),
  createdAt: s.created_at,
})

export const toUserReputation = (u) => ({
  id: u.id,
  username: u.username,
  displayName: u.display_name,
  avatarUrl: u.avatar_url,
  bio: u.bio,
  joinedAt: u.joined_at,
  isArtist: Boolean(u.is_artist),
  artistHandle: u.artist_handle,
  completedCommissions: u.completed_commissions ?? 0,
  rating: u.rating_avg ?? 0,
  reviewCount: u.review_count ?? 0,
  subRatingAverages: u.sub_rating_averages ?? {},
  wouldWorkAgainPct: u.would_work_again_pct,
  ratingDistribution: u.distribution ?? [],
})

export const toPage = (payload, mapItem) => ({
  items: (payload?.items ?? []).map(mapItem),
  total: payload?.total ?? 0,
  page: payload?.page ?? 1,
  pageSize: payload?.page_size ?? 12,
})
