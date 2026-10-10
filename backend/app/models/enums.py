from __future__ import annotations

import enum

class TagCategory(str, enum.Enum):

    STYLE = "style"
    CONTENT = "content"
    COMMISSION_TYPE = "commission_type"

class CommissionStatus(str, enum.Enum):

    REQUESTED = "requested"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ReviewSubjectType(str, enum.Enum):

    ARTIST = "artist"
    CLIENT = "client"

class CommissionType(str, enum.Enum):

    BUST = "bust"
    HALF_BODY = "half_body"
    FULL_BODY = "full_body"
    REF_SHEET = "ref_sheet"
    ILLUSTRATION = "illustration"
    EMOTE_SET = "emote_set"
    ICON = "icon"
    ANIMATION = "animation"
    CHARACTER_DESIGN = "character_design"
