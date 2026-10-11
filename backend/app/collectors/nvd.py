import httpx

from app.schemas.case import CaseCreate


NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"


async def fetch_cves(limit: int = 5) -> dict:
    """Fetch recent CVE records from the NVD API."""

    if not 1 <= limit <= 100:
        raise ValueError("limit must be between 1 and 100")

    params = {
        "resultsPerPage": limit,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            NVD_API_URL,
            params=params,
        )
        response.raise_for_status()

        return response.json()


def extract_vendor_product(
    cve: dict,
) -> tuple[str | None, str | None]:
    """Extract the first available vulnerable vendor and product from CPE."""

    configurations = cve.get("configurations", [])

    for configuration in configurations:
        for node in configuration.get("nodes", []):
            for match in node.get("cpeMatch", []):
                if not match.get("vulnerable", False):
                    continue

                criteria = match.get("criteria", "")
                parts = criteria.split(":")

                # CPE 2.3 format:
                # cpe:2.3:<part>:<vendor>:<product>:<version>:...
                if len(parts) < 6:
                    continue

                if parts[0:2] != ["cpe", "2.3"]:
                    continue

                vendor = parts[3]
                product = parts[4]

                if vendor in ("", "*", "-"):
                    vendor = None

                if product in ("", "*", "-"):
                    product = None

                if vendor or product:
                    return (
                        vendor.replace("_", " ") if vendor else None,
                        product.replace("_", " ") if product else None,
                    )

    return None, None


def extract_severity(cve: dict) -> str | None:
    """Extract CVSS severity from the highest available supported version."""

    metrics = cve.get("metrics", {})

    metric_keys = (
        "cvssMetricV40",
        "cvssMetricV31",
        "cvssMetricV30",
        "cvssMetricV2",
    )

    for metric_key in metric_keys:
        metric_list = metrics.get(metric_key, [])

        if not metric_list:
            continue

        # Prefer the NVD's primary assessment when available.
        ordered_metrics = sorted(
            metric_list,
            key=lambda metric: (
                metric.get("type") != "Primary",
                metric.get("source") != "nvd@nist.gov",
            ),
        )

        for metric in ordered_metrics:
            severity = (
                metric.get("cvssData", {}).get("baseSeverity")
                or metric.get("baseSeverity")
            )

            if severity:
                return severity.upper()

            # CVSS v2 records may not always provide a severity string.
            # Do not invent a severity when the source omits it.

    return None


def cve_to_case(cve: dict) -> CaseCreate:
    """Convert an NVD CVE object into a RADAR Case."""

    descriptions = cve.get("descriptions", [])

    description = next(
        (
            item.get("value")
            for item in descriptions
            if item.get("lang") == "en"
        ),
        None,
    )

    company, product = extract_vendor_product(cve)
    severity = extract_severity(cve)

    return CaseCreate(
        title=cve.get("id", "Unknown CVE"),
        summary=description,
        severity=severity,
        cve_id=cve.get("id"),
        company=company,
        product=product,
        published_at=cve.get("published"),
    )