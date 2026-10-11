import asyncio

from sqlalchemy import select

from app.collectors.nvd import cve_to_case, fetch_cves
from app.database import SessionLocal
from app.models import Case


async def main():
    db = SessionLocal()

    try:
        existing_cases = db.scalars(
            select(Case).where(Case.cve_id.is_not(None))
        ).all()

        if not existing_cases:
            print("No existing CVE cases found.")
            return

        updated_count = 0
        not_found_count = 0

        for existing_case in existing_cases:
            data = await fetch_cves(1)

            # Search NVD specifically for the existing CVE.
            # This is handled below using the dedicated CVE endpoint.
            break

        async with __import__("httpx").AsyncClient(timeout=30.0) as client:
            for existing_case in existing_cases:
                response = await client.get(
                    "https://services.nvd.nist.gov/rest/json/cves/2.0",
                    params={"cveId": existing_case.cve_id},
                )
                response.raise_for_status()

                payload = response.json()
                vulnerabilities = payload.get("vulnerabilities", [])

                if not vulnerabilities:
                    not_found_count += 1
                    continue

                cve_data = vulnerabilities[0]["cve"]
                updated_case = cve_to_case(cve_data)

                existing_case.summary = updated_case.summary
                existing_case.severity = updated_case.severity
                existing_case.company = updated_case.company
                existing_case.product = updated_case.product
                existing_case.published_at = updated_case.published_at

                updated_count += 1

        db.commit()

        print(f"Updated cases: {updated_count}")
        print(f"CVEs not found: {not_found_count}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


asyncio.run(main())