from __future__ import annotations

from typing import TypeVar

from fastapi import APIRouter, Response, status
from sqlalchemy import select

from app.core.errors import NotFoundError
from app.core.security import ArtistOwner, DbSession
from app.models import ArtistProfile, PortfolioImage, SheetImage
from app.schemas.artist import ImageCreate, ImageRead, ImageUpdate, ReorderRequest
from app.schemas.common import ERROR_RESPONSES

ImageModel = TypeVar("ImageModel", SheetImage, PortfolioImage)

router = APIRouter(prefix="/artists/me", tags=["artist-management"], responses=ERROR_RESPONSES)

def _owned(db: DbSession, model: type, profile: ArtistProfile, image_id: str):
    image = db.scalar(
        select(model).where(model.id == image_id, model.artist_id == profile.id)
    )
    if image is None:
        raise NotFoundError("No such image")
    return image

def register_image_routes(model: type, path: str, noun: str) -> None:

    @router.post(
        f"/{path}",
        response_model=ImageRead,
        status_code=status.HTTP_201_CREATED,
        summary=f"Add a {noun}",
        name=f"create_{path.replace('-', '_')}",
    )
    def create_image(
        payload: ImageCreate, profile: ArtistOwner, db: DbSession
    ) -> ImageRead:
        image = model(artist_id=profile.id, **payload.model_dump())
        db.add(image)
        db.commit()
        db.refresh(image)
        return ImageRead.model_validate(image)

    @router.patch(
        f"/{path}/{{image_id}}",
        response_model=ImageRead,
        summary=f"Update a {noun}",
        name=f"update_{path.replace('-', '_')}",
    )
    def update_image(
        image_id: str, payload: ImageUpdate, profile: ArtistOwner, db: DbSession
    ) -> ImageRead:
        image = _owned(db, model, profile, image_id)
        for field_name, value in payload.model_dump(exclude_unset=True).items():
            setattr(image, field_name, value)
        db.commit()
        db.refresh(image)
        return ImageRead.model_validate(image)

    @router.delete(
        f"/{path}/{{image_id}}",
        status_code=status.HTTP_204_NO_CONTENT,
        summary=f"Delete a {noun}",
        name=f"delete_{path.replace('-', '_')}",
    )
    def delete_image(image_id: str, profile: ArtistOwner, db: DbSession) -> Response:
        db.delete(_owned(db, model, profile, image_id))
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    @router.put(
        f"/{path}/reorder",
        response_model=list[ImageRead],
        summary=f"Rewrite the display order of your {noun}s",
        name=f"reorder_{path.replace('-', '_')}",
    )
    def reorder_images(
        payload: ReorderRequest, profile: ArtistOwner, db: DbSession
    ) -> list[ImageRead]:
        owned = {
            img.id: img
            for img in db.scalars(select(model).where(model.artist_id == profile.id)).all()
        }
        if any(image_id not in owned for image_id in payload.ids):
            raise NotFoundError("One or more images do not exist or are not yours")

        listed = set(payload.ids)
        for index, image_id in enumerate(payload.ids):
            owned[image_id].sort_order = index
        for offset, image in enumerate(
            (img for iid, img in owned.items() if iid not in listed), start=len(payload.ids)
        ):
            image.sort_order = offset

        db.commit()
        return [
            ImageRead.model_validate(img)
            for img in sorted(owned.values(), key=lambda i: i.sort_order)
        ]

register_image_routes(SheetImage, "sheet-images", "commission sheet image")
register_image_routes(PortfolioImage, "portfolio-images", "portfolio image")
