from __future__ import annotations

from typing import TypedDict

STYLE_TAGS: list[tuple[str, str]] = [
    ("anime", "Anime"),
    ("semi_realism", "Semi-realism"),
    ("realism", "Realism"),
    ("cartoon", "Cartoon"),
    ("chibi", "Chibi"),
    ("pixel_art", "Pixel art"),
    ("painterly", "Painterly"),
    ("lineart", "Lineart"),
    ("sketch", "Sketch"),
    ("3d_render", "3D render"),
    ("comic", "Comic"),
]

CONTENT_TAGS: list[tuple[str, str, str, bool]] = [
    ("oc_friendly", "OC friendly", "Happily draws original characters from your references.", False),
    ("fanart", "Fanart", "Takes commissions of existing published characters.", False),
    ("furry", "Furry", "Non-human and fursona characters.", False),
    ("anthro", "Anthro", "Anthropomorphic body types and animal features.", False),
    ("mecha", "Mecha", "Hard-surface robots, suits and vehicles.", False),
    ("horror", "Horror", "Unsettling themes and creature design.", False),
    ("gore", "Gore", "Graphic blood and injury. Hidden unless explicitly enabled.", True),
    ("nsfw_18plus", "NSFW (18+)", "Adult content. Hidden unless explicitly enabled.", True),
    ("pet_portrait", "Pet portrait", "Real animals drawn from photographs.", False),
    ("ref_sheet", "Reference sheet", "Full turnaround sheets with palettes and callouts.", False),
    ("landscape", "Landscape", "Environments, backgrounds and scenery.", False),
    ("tattoo_design", "Tattoo design", "Artwork prepared for tattooing, stencil-ready.", False),
    ("emotes_vtuber", "Emotes & VTuber", "Twitch/Discord emotes, badges and model assets.", False),
]

COMMISSION_TYPE_TAGS: list[tuple[str, str]] = [
    ("bust", "Bust"),
    ("half_body", "Half body"),
    ("full_body", "Full body"),
    ("ref_sheet", "Reference sheet"),
    ("illustration", "Illustration"),
    ("emote_set", "Emote set"),
    ("icon", "Icon"),
    ("animation", "Animation"),
    ("character_design", "Character design"),
]

TOS: dict[str, str] = {
    "standard": (
        "Half up front, half on delivery. Two rounds of revisions included; further rounds "
        "are billed at $15 each. Commercial use requires a separate licence. Please allow "
        "the full turnaround window before asking for an update."
    ),
    "strict": (
        "Payment in full before work begins. No refunds once sketching has started. One "
        "revision at the sketch stage only - no changes after linework. Personal use only; "
        "I retain the right to post the work."
    ),
    "relaxed": (
        "Pay whenever the sketch looks right to you. Unlimited small tweaks, I would rather "
        "you love it. Ask me about payment plans if the total is over $200 - that is "
        "completely fine."
    ),
    "commercial": (
        "50% non-refundable deposit. Commercial and merchandising licences quoted separately "
        "and included in the invoice. Files delivered as layered PSD plus flattened PNG at "
        "300 DPI."
    ),
}

EN = ["English"]
EN_ES = ["English", "Spanish"]
EN_JP = ["English", "Japanese"]

class ArtistSeed(TypedDict):
    handle: str
    display_name: str
    location: str
    languages: list[str]
    bio: str
    styles: list[str]
    content_tags: list[str]
    commission_types: list[str]
    price_min: str
    price_max: str
    is_open: bool
    slots_open: int
    slots_total: int
    turnaround_days: int
    tos: str
    joined_days_ago: int
    last_active_days_ago: int
    completed: int

ARTISTS: list[ArtistSeed] = [
    {"handle": "mira_oku", "display_name": "Mira Okuda", "location": "Portland, OR",
     "languages": EN_JP,
     "bio": "Soft-lit anime portraits with a painterly finish. Nine years of drawing other people's OCs and still excited about a good ref sheet.",
     "styles": ["anime", "semi_realism", "painterly"],
     "content_tags": ["oc_friendly", "fanart", "ref_sheet"],
     "commission_types": ["bust", "half_body", "illustration"],
     "price_min": "85.00", "price_max": "260.00", "is_open": True, "slots_open": 3,
     "slots_total": 5, "turnaround_days": 14, "tos": "standard",
     "joined_days_ago": 2380, "last_active_days_ago": 0, "completed": 410},

    {"handle": "pixelpaw", "display_name": "Devon Reyes", "location": "Austin, TX",
     "languages": EN,
     "bio": "Tiny sprites, big personality. 32x32 up to full portrait pixel work, delivered with an animated idle if you want one.",
     "styles": ["pixel_art", "chibi"],
     "content_tags": ["oc_friendly", "emotes_vtuber"],
     "commission_types": ["icon", "emote_set", "animation"],
     "price_min": "18.00", "price_max": "65.00", "is_open": True, "slots_open": 6,
     "slots_total": 8, "turnaround_days": 5, "tos": "relaxed",
     "joined_days_ago": 1900, "last_active_days_ago": 1, "completed": 305},

    {"handle": "inkwellhana", "display_name": "Hana Petrov", "location": "Prague, CZ",
     "languages": EN,
     "bio": "Black-and-white lineart and inked comic pages. Heavy hatching, everything drawn traditionally then cleaned digitally.",
     "styles": ["lineart", "comic", "sketch"],
     "content_tags": ["oc_friendly", "horror", "fanart"],
     "commission_types": ["illustration", "half_body", "full_body"],
     "price_min": "120.00", "price_max": "400.00", "is_open": False, "slots_open": 0,
     "slots_total": 4, "turnaround_days": 21, "tos": "strict",
     "joined_days_ago": 2500, "last_active_days_ago": 9, "completed": 190},

    {"handle": "solene3d", "display_name": "Solene Marchand", "location": "Lyon, FR",
     "languages": EN,
     "bio": "Blender character sculpts and turntables. Game-ready topology available on request, retopo quoted separately.",
     "styles": ["3d_render", "realism"],
     "content_tags": ["oc_friendly", "mecha", "ref_sheet"],
     "commission_types": ["character_design", "ref_sheet", "animation"],
     "price_min": "450.00", "price_max": "1600.00", "is_open": True, "slots_open": 1,
     "slots_total": 2, "turnaround_days": 45, "tos": "commercial",
     "joined_days_ago": 1680, "last_active_days_ago": 2, "completed": 58},

    {"handle": "tobbybun", "display_name": "Toby Nakashima", "location": "Vancouver, BC",
     "languages": EN,
     "bio": "Round, bouncy chibis and sticker packs. Fastest turnaround on the board - most icons go out inside 72 hours.",
     "styles": ["chibi", "cartoon"],
     "content_tags": ["oc_friendly", "emotes_vtuber"],
     "commission_types": ["icon", "emote_set", "bust"],
     "price_min": "15.00", "price_max": "55.00", "is_open": True, "slots_open": 9,
     "slots_total": 12, "turnaround_days": 3, "tos": "relaxed",
     "joined_days_ago": 2070, "last_active_days_ago": 0, "completed": 760},

    {"handle": "verdantfox", "display_name": "Rowan Feld", "location": "Glasgow, UK",
     "languages": EN,
     "bio": "Anthro and fursona work with real anatomy behind it. Full ref sheets with palettes, markings and turnarounds.",
     "styles": ["semi_realism", "painterly"],
     "content_tags": ["furry", "anthro", "ref_sheet", "oc_friendly"],
     "commission_types": ["ref_sheet", "full_body", "character_design"],
     "price_min": "200.00", "price_max": "620.00", "is_open": True, "slots_open": 2,
     "slots_total": 4, "turnaround_days": 28, "tos": "standard",
     "joined_days_ago": 2270, "last_active_days_ago": 1, "completed": 240},

    {"handle": "nocturne_ash", "display_name": "Ash Vellum", "location": "Berlin, DE",
     "languages": EN,
     "bio": "Dark fantasy and creature design. Mature themes handled professionally - restricted work is quoted privately and gated.",
     "styles": ["painterly", "realism"],
     "content_tags": ["horror", "gore", "oc_friendly"],
     "commission_types": ["illustration", "character_design"],
     "price_min": "300.00", "price_max": "900.00", "is_open": True, "slots_open": 1,
     "slots_total": 3, "turnaround_days": 30, "tos": "strict",
     "joined_days_ago": 1830, "last_active_days_ago": 3, "completed": 112},

    {"handle": "clementine_ink", "display_name": "Clementine Boyd", "location": "Melbourne, AU",
     "languages": EN,
     "bio": "Flash-style tattoo designs, stencil-ready. I work with your artist's placement notes so nothing gets lost in transfer.",
     "styles": ["lineart", "cartoon"],
     "content_tags": ["tattoo_design", "landscape", "oc_friendly"],
     "commission_types": ["illustration", "character_design"],
     "price_min": "90.00", "price_max": "340.00", "is_open": True, "slots_open": 4,
     "slots_total": 6, "turnaround_days": 12, "tos": "standard",
     "joined_days_ago": 1580, "last_active_days_ago": 0, "completed": 148},

    {"handle": "kaijugarden", "display_name": "Yuki Mori", "location": "Osaka, JP",
     "languages": EN_JP,
     "bio": "Mecha, kaiju and hard-surface design. Orthographic views included with every character design commission.",
     "styles": ["anime", "comic", "lineart"],
     "content_tags": ["mecha", "oc_friendly", "fanart"],
     "commission_types": ["character_design", "illustration", "ref_sheet"],
     "price_min": "240.00", "price_max": "780.00", "is_open": False, "slots_open": 0,
     "slots_total": 3, "turnaround_days": 35, "tos": "commercial",
     "joined_days_ago": 2700, "last_active_days_ago": 21, "completed": 165},

    {"handle": "brushandbramble", "display_name": "Nadia Okonkwo", "location": "Lagos, NG",
     "languages": EN,
     "bio": "Oil-feel digital portraits and landscapes. I take my time; expect four to six weeks and a lot of process shots.",
     "styles": ["painterly", "realism", "semi_realism"],
     "content_tags": ["landscape", "pet_portrait", "oc_friendly"],
     "commission_types": ["illustration", "bust"],
     "price_min": "320.00", "price_max": "1100.00", "is_open": True, "slots_open": 1,
     "slots_total": 2, "turnaround_days": 42, "tos": "standard",
     "joined_days_ago": 2170, "last_active_days_ago": 4, "completed": 90},

    {"handle": "looploop", "display_name": "Sam Ibarra", "location": "Mexico City, MX",
     "languages": EN_ES,
     "bio": "Just opened shop. Bright cartoon half-bodies and Discord emote sets. Building a portfolio, so prices are low on purpose.",
     "styles": ["cartoon", "chibi"],
     "content_tags": ["emotes_vtuber", "oc_friendly"],
     "commission_types": ["emote_set", "icon", "half_body"],
     "price_min": "12.00", "price_max": "48.00", "is_open": True, "slots_open": 5,
     "slots_total": 5, "turnaround_days": 7, "tos": "relaxed",
     "joined_days_ago": 30, "last_active_days_ago": 0, "completed": 0},

    {"handle": "graphitegull", "display_name": "Priya Raman", "location": "Bengaluru, IN",
     "languages": EN,
     "bio": "Graphite-look sketch commissions. Loose, gestural, cheap enough to order three of. Digital only, no physical shipping.",
     "styles": ["sketch", "lineart"],
     "content_tags": ["oc_friendly", "fanart", "pet_portrait"],
     "commission_types": ["bust", "half_body"],
     "price_min": "20.00", "price_max": "70.00", "is_open": True, "slots_open": 7,
     "slots_total": 10, "turnaround_days": 6, "tos": "relaxed",
     "joined_days_ago": 2020, "last_active_days_ago": 1, "completed": 520},

    {"handle": "auroraveil", "display_name": "Ingrid Solheim", "location": "Oslo, NO",
     "languages": EN,
     "bio": "Ethereal semi-realism with a lot of rim light. Waitlist is long but I keep it honest - you get a date, not a maybe.",
     "styles": ["semi_realism", "painterly", "anime"],
     "content_tags": ["oc_friendly", "fanart", "landscape"],
     "commission_types": ["illustration", "half_body", "bust"],
     "price_min": "180.00", "price_max": "520.00", "is_open": True, "slots_open": 0,
     "slots_total": 6, "turnaround_days": 33, "tos": "standard",
     "joined_days_ago": 2950, "last_active_days_ago": 2, "completed": 380},

    {"handle": "crimsonvow", "display_name": "Elise Tran", "location": "Montreal, QC",
     "languages": EN_ES,
     "bio": "Adult illustration studio work, 18+ only. Age verification required before I will send the price sheet.",
     "styles": ["semi_realism", "anime"],
     "content_tags": ["nsfw_18plus", "oc_friendly", "fanart"],
     "commission_types": ["illustration", "full_body"],
     "price_min": "260.00", "price_max": "700.00", "is_open": True, "slots_open": 2,
     "slots_total": 4, "turnaround_days": 25, "tos": "strict",
     "joined_days_ago": 2110, "last_active_days_ago": 1, "completed": 178},

    {"handle": "studiobellwether", "display_name": "Marcus Hale", "location": "Chicago, IL",
     "languages": EN,
     "bio": "Comic pages, storyboards and sequential work for indie books. Per-page rates; script-to-page or thumbnails welcome.",
     "styles": ["comic", "lineart", "cartoon"],
     "content_tags": ["fanart", "oc_friendly", "mecha"],
     "commission_types": ["illustration", "character_design"],
     "price_min": "150.00", "price_max": "480.00", "is_open": False, "slots_open": 0,
     "slots_total": 5, "turnaround_days": 40, "tos": "commercial",
     "joined_days_ago": 2760, "last_active_days_ago": 45, "completed": 132},

    {"handle": "minttofu", "display_name": "Jia Wen Lim", "location": "Singapore, SG",
     "languages": EN,
     "bio": "Pastel anime icons and VTuber assets. Twitch panels, sub badges and PNGtuber rigs bundled at a discount.",
     "styles": ["anime", "chibi", "cartoon"],
     "content_tags": ["emotes_vtuber", "oc_friendly"],
     "commission_types": ["icon", "emote_set", "bust"],
     "price_min": "35.00", "price_max": "140.00", "is_open": True, "slots_open": 3,
     "slots_total": 6, "turnaround_days": 10, "tos": "standard",
     "joined_days_ago": 1770, "last_active_days_ago": 0, "completed": 640},

    {"handle": "fenwickpaints", "display_name": "Oliver Fenwick", "location": "Dublin, IE",
     "languages": EN,
     "bio": "Pet portraits from your photos, painted the way a Victorian would have wanted. Two weeks, framed print optional.",
     "styles": ["realism", "painterly"],
     "content_tags": ["pet_portrait", "landscape"],
     "commission_types": ["illustration", "bust"],
     "price_min": "110.00", "price_max": "300.00", "is_open": True, "slots_open": 4,
     "slots_total": 8, "turnaround_days": 16, "tos": "standard",
     "joined_days_ago": 1450, "last_active_days_ago": 2, "completed": 268},

    {"handle": "thornfieldco", "display_name": "Bea Thornfield", "location": "Toronto, ON",
     "languages": EN,
     "bio": "New here, coming from six years of agency design. Clean character design decks with silhouettes, palettes and expression sheets.",
     "styles": ["cartoon", "lineart", "3d_render"],
     "content_tags": ["oc_friendly", "ref_sheet", "mecha"],
     "commission_types": ["character_design", "ref_sheet"],
     "price_min": "220.00", "price_max": "560.00", "is_open": True, "slots_open": 4,
     "slots_total": 4, "turnaround_days": 20, "tos": "commercial",
     "joined_days_ago": 12, "last_active_days_ago": 0, "completed": 3},
]

CLIENTS: list[tuple[str, str]] = [
    ("kestrel_dev", "Kestrel Adeyemi"),
    ("mossyfern", "Moss Lindqvist"),
    ("ttv_halcyon", "Halcyon Reyes"),
    ("quietbramble", "Wren Baptiste"),
    ("nine_of_cups", "Nina Kovac"),
    ("oakandiron", "Ike Oyelaran"),
    ("palefirefly", "Fira Tanaka"),
    ("sorrel_ashes", "Sorrel Ashby"),
    ("vex_and_vine", "Vex Moreau"),
    ("harbourlight", "Harbour Nilsen"),
    ("tinroofdream", "Teodora Ilic"),
    ("cobaltmagpie", "Cobalt Nwosu"),
]

ARTIST_REVIEW_BODIES: list[str] = [
    "Communicated the whole way through and delivered two days early. The sketch already looked like my character, which almost never happens.",
    "Worth the wait. I asked for one small change to the lighting and got it back the same evening.",
    "Exactly what the commission sheet promised - no surprise fees, no scope creep. Would book again for the ref sheet.",
    "Great work, though the turnaround ran about a week past the estimate. Kept me updated the whole time, so no real complaints.",
    "The linework is unreal up close. Printed it at A3 and it still holds up.",
    "Second time commissioning and the consistency is why I keep coming back.",
    "Good piece overall. The first draft missed a couple of details from my reference sheet, but the revision fixed everything.",
    "Fast, friendly and completely painless. The payment terms were clear before I committed to anything.",
    "Took my vague 'something moody' brief and turned it into the best piece of my OC I own.",
    "Perfect. No notes.",
]

CLIENT_REVIEW_BODIES: list[str] = [
    "Clear brief, sent references up front, paid the deposit within the hour. Ideal client.",
    "Patient through a slower month on my end and never once chased me. Happy to work together again.",
    "Knew exactly what they wanted and said so plainly. Revisions stayed inside scope.",
    "Payment came a few days late but they flagged it in advance, which is all I ask.",
    "Lovely to work with - gave genuinely useful feedback instead of just 'make it pop'.",
    "Respectful about my boundaries when I declined part of the original request.",
    "Brief shifted twice mid-project. We sorted it, but budget a little extra time.",
    "Quick approvals at every stage. The whole thing wrapped a week early because of it.",
]

COMMISSION_TITLES: list[str] = [
    "Half body of my DnD rogue",
    "Ref sheet for a new fursona",
    "Twitch emote set - 5 expressions",
    "Bust portrait, soft lighting",
    "Full illustration for a book cover",
    "Profile icon with transparent background",
    "Character design deck for an indie game",
    "Pet portrait from a photo",
    "Mecha pilot in cockpit",
    "Tattoo design - forearm piece",
    "Animated idle loop for a stream overlay",
    "Comic page, six panels",
]
