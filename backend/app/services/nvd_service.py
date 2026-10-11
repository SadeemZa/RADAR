from sqlalchemy import select
from sqlalchemy.orm import Session

from app.collectors.nvd import cve_to_case, fetch_cves
from app.models import Case


async def import_cves(db: Session, limit: int = 5) -> dict[str, int]:
    """
    Import CVEs from NVD.

    - Insert new CVEs.
    - Update existing CVEs.
    - Avoid duplicate records.
    """

    data = await fetch_cves(limit)
    vulnerabilities = data.get("vulnerabilities", [])

    imported_count = 0
    updated_count = 0
    skipped_count = 0

    try:
        for item in vulnerabilities:
            cve_data = item.get("cve")

            if not cve_data or not cve_data.get("id"):
                skipped_count += 1
                continue

            case_data = cve_to_case(cve_data)

            existing_case = db.scalar(
                select(Case).where(Case.cve_id == case_data.cve_id)
            )

            if existing_case is None:
                new_case = Case(**case_data.model_dump())
                db.add(new_case)
                imported_count += 1
                continue

            # Update existing records only when NVD provides a value.
            new_values = case_data.model_dump(exclude_none=True)

            for field, value in new_values.items():
                if field != "cve_id" and field != "title":
                    setattr(existing_case, field, value)

            # Keep the title synchronized with the CVE identifier.
            existing_case.title = case_data.title

            updated_count += 1

        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "imported": imported_count,
        "updated": updated_count,
        "skipped": skipped_count,
    }