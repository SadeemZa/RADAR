from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Case
from app.schemas.case import CaseCreate, CaseResponse
from app.services.nvd_service import import_cves


router = APIRouter(prefix="/cases", tags=["Cases"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[CaseResponse])
def get_cases(
    search: str | None = Query(default=None, description="Search by CVE, title, vendor, or product"),
    severity: str | None = Query(default=None, description="Filter by severity"),
    vendor: str | None = Query(default=None, description="Filter by vendor"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = select(Case)

    if search:
        term = f"%{search.strip()}%"
        query = query.where(
            or_(
                Case.cve_id.ilike(term),
                Case.title.ilike(term),
                Case.company.ilike(term),
                Case.product.ilike(term),
                Case.summary.ilike(term),
            )
        )

    if severity:
        query = query.where(Case.severity == severity.strip().upper())

    if vendor:
        query = query.where(Case.company.ilike(f"%{vendor.strip()}%"))

    query = (
        query.order_by(Case.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(query).all()


@router.post("/", response_model=CaseResponse)
def create_case(case_data: CaseCreate, db: Session = Depends(get_db)):
    case = Case(**case_data.model_dump())
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


@router.post("/import/nvd")
async def import_nvd_cases(
    limit: int = Query(default=5, ge=1, le=100),
    db: Session = Depends(get_db),
):
    result = await import_cves(db=db, limit=limit)
    return {"status": "ok", **result}