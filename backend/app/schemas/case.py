from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CaseCreate(BaseModel):
    """Data required to create a cybersecurity case."""

    title: str
    summary: str | None = None
    severity: str | None = None
    cve_id: str | None = None
    company: str | None = None
    product: str | None = None
    published_at: datetime | None = None


class CaseResponse(CaseCreate):
    """Data returned by the RADAR Cases API."""

    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)