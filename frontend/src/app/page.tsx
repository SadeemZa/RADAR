"use client";

import { useEffect, useMemo, useState } from "react";
import "./radar.css";

type CaseItem = {
  id: number;
  title: string;
  cve_id: string | null;
  summary: string | null;
  severity: string | null;
  company: string | null;
  product: string | null;
  published_at: string | null;
  created_at: string;
};

const API_URL = "http://127.0.0.1:8000";

const severityOrder: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  UNKNOWN: 4,
};

function severityLabel(value: string | null) {
  const severity = value?.toUpperCase();

  if (severity === "CRITICAL") return "Critical";
  if (severity === "HIGH") return "High";
  if (severity === "MEDIUM") return "Medium";
  if (severity === "LOW") return "Low";

  return "Unclassified";
}

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function Home() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCases() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/cases/?limit=100`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data: CaseItem[] = await response.json();
        setCases(data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(
          "Unable to connect to RADAR API. Make sure the backend is running."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadCases();

    return () => controller.abort();
  }, [refreshKey]);

  const filteredCases = useMemo(() => {
    const term = search.trim().toLowerCase();

    return cases
      .filter((item) => {
        const matchesSearch =
          !term ||
          [
            item.cve_id,
            item.title,
            item.company,
            item.product,
            item.summary,
          ]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(term));

        const matchesSeverity =
          severity === "ALL" ||
          (item.severity ?? "UNKNOWN").toUpperCase() === severity;

        return matchesSearch && matchesSeverity;
      })
      .sort((a, b) => {
        const first =
          severityOrder[(a.severity ?? "UNKNOWN").toUpperCase()] ?? 4;
        const second =
          severityOrder[(b.severity ?? "UNKNOWN").toUpperCase()] ?? 4;

        if (first !== second) return first - second;

        return (
          new Date(b.published_at ?? b.created_at).getTime() -
          new Date(a.published_at ?? a.created_at).getTime()
        );
      });
  }, [cases, search, severity]);

  const countSeverity = (level: string) =>
    cases.filter((item) => item.severity?.toUpperCase() === level).length;

  const latestCases = [...cases].sort(
    (a, b) =>
      new Date(b.published_at ?? b.created_at).getTime() -
      new Date(a.published_at ?? a.created_at).getTime()
  );

  return (
    <main className="radar-app">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="RADAR home">
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          <span>
            <strong>RADAR</strong>
            <small>THREAT INTELLIGENCE</small>
          </span>
        </a>

        <div className="side-label">WORKSPACE</div>

        <nav className="navigation">
          <a className="nav-item active" href="#overview">
            <span>◫</span> Overview
          </a>
          <a className="nav-item" href="#map">
            <span>◎</span> Threat map
          </a>
          <a className="nav-item" href="#vulnerabilities">
            <span>⌘</span> Vulnerabilities
            <span className="nav-count">{cases.length}</span>
          </a>
          <a className="nav-item" href="#incidents">
            <span>⌁</span> Incidents
          </a>
          <a className="nav-item" href="#sources">
            <span>◉</span> Intelligence sources
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="connection-indicator">
            <span className={error ? "status-dot offline" : "status-dot"} />
            <span>{error ? "API disconnected" : "RADAR workspace"}</span>
          </div>
          <div className="sidebar-footer">
            <span className="footer-avatar">R</span>
            <div>
              <strong>RADAR</strong>
              <small>Local environment</small>
            </div>
          </div>
          <div className="version-label">DEVELOPMENT BUILD · 0.1.0</div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>Overview</strong>
          </div>

          <div className="topbar-right">
            <span className="live-indicator">
              <span /> LIVE API
            </span>
            <button
              className="icon-button"
              title="Refresh vulnerability data"
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              ↻
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="page-heading" id="overview">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                SECURITY INTELLIGENCE PLATFORM
              </div>
              <h1>
                Threat <span>overview.</span>
              </h1>
              <p>
                Monitor vulnerabilities. Explore intelligence. Stay ahead.
              </p>
            </div>

            <div className="updated-label">
              <span className="status-dot" />
              <span>
                {loading ? "Syncing data..." : error ? "Offline" : "Connected"}
              </span>
            </div>
          </section>

          {error && (
            <div className="error-banner">
              <span>!</span>
              <div>
                <strong>Unable to load vulnerability data</strong>
                <p>{error}</p>
              </div>
              <button onClick={() => setRefreshKey((key) => key + 1)}>
                Retry
              </button>
            </div>
          )}

          <section className="stats-grid" aria-label="Vulnerability statistics">
            <article className="stat-card total-card">
              <div className="stat-top">
                <span className="stat-icon purple-icon">⌘</span>
                <span className="stat-caption">DATABASE RECORDS</span>
              </div>
              <div className="stat-number">
                {loading ? "—" : cases.length}
              </div>
              <div className="stat-bottom">
                <span>Total vulnerabilities</span>
                <span className="stat-symbol">↗</span>
              </div>
              <div className="stat-decoration purple-decoration" />
            </article>

            <article className="stat-card critical-card">
              <div className="stat-top">
                <span className="stat-icon red-icon">▲</span>
                <span className="stat-caption">SEVERITY LEVEL</span>
              </div>
              <div className="stat-number">
                {loading ? "—" : countSeverity("CRITICAL")}
              </div>
              <div className="stat-bottom">
                <span>Critical</span>
                <span className="severity-dot critical-dot" />
              </div>
              <div className="stat-decoration red-decoration" />
            </article>

            <article className="stat-card high-card">
              <div className="stat-top">
                <span className="stat-icon orange-icon">◆</span>
                <span className="stat-caption">SEVERITY LEVEL</span>
              </div>
              <div className="stat-number">
                {loading ? "—" : countSeverity("HIGH")}
              </div>
              <div className="stat-bottom">
                <span>High severity</span>
                <span className="severity-dot high-dot" />
              </div>
              <div className="stat-decoration orange-decoration" />
            </article>

            <article className="stat-card medium-card">
              <div className="stat-top">
                <span className="stat-icon yellow-icon">◈</span>
                <span className="stat-caption">SEVERITY LEVEL</span>
              </div>
              <div className="stat-number">
                {loading ? "—" : countSeverity("MEDIUM")}
              </div>
              <div className="stat-bottom">
                <span>Medium severity</span>
                <span className="severity-dot medium-dot" />
              </div>
              <div className="stat-decoration yellow-decoration" />
            </article>
          </section>

          <section className="map-section panel" id="map">
            <div className="section-heading">
              <div>
                <div className="section-kicker">GLOBAL MONITORING</div>
                <h2>Threat landscape</h2>
                <p>Geographic intelligence overview</p>
              </div>
              <span className="map-tag">
                <span className="status-dot muted-dot" />
                GEO DATA NOT CONNECTED
              </span>
            </div>

            <div className="map-canvas">
              <div className="map-grid" />
              <svg
                className="world-map"
                viewBox="0 0 1000 430"
                role="img"
                aria-label="Stylized world map background; geographic incident data is not yet connected"
              >
                <defs>
                  <pattern
                    id="map-dots"
                    width="7"
                    height="7"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="2" cy="2" r="1.35" fill="#526a89" />
                  </pattern>
                  <linearGradient id="map-fade" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#294c77" stopOpacity=".65" />
                    <stop offset="100%" stopColor="#101b2c" stopOpacity=".18" />
                  </linearGradient>
                </defs>

                <g fill="url(#map-dots)" stroke="#385475" strokeWidth="1.1">
                  <path d="M74 92 L119 60 184 49 227 65 265 88 284 120 260 141 240 158 218 184 199 210 179 222 164 197 144 183 132 150 101 137 84 113Z" />
                  <path d="M224 224 L252 231 276 261 283 293 269 334 251 373 232 346 224 310 207 277 207 248Z" />
                  <path d="M385 100 L422 77 465 69 499 80 519 103 549 102 566 121 596 111 629 124 659 109 698 113 723 136 763 137 800 121 847 136 877 165 858 190 826 197 804 219 774 223 751 247 715 241 692 259 675 281 649 268 630 240 599 227 576 199 548 188 526 162 494 156 464 132 434 130 411 145 393 130Z" />
                  <path d="M426 167 L458 173 480 201 477 230 458 252 449 284 428 306 411 286 408 255 394 227 403 197Z" />
                  <path d="M742 253 L771 248 800 265 814 291 793 311 773 303 755 284Z" />
                  <path d="M843 319 L866 309 890 324 884 346 859 350 842 337Z" />
                </g>

                <g fill="none" stroke="#42688f" strokeWidth=".7" opacity=".45">
                  <path d="M40 145 H960 M40 215 H960 M40 285 H960 M40 355 H960" />
                  <path d="M180 35 V390 M340 35 V390 M500 35 V390 M660 35 V390 M820 35 V390" />
                </g>

                <g fill="url(#map-fade)" opacity=".5">
                  <circle cx="185" cy="150" r="70" />
                  <circle cx="515" cy="175" r="90" />
                  <circle cx="750" cy="190" r="75" />
                </g>
              </svg>

              <div className="map-overlay top-left">
                <span className="map-overlay-label">COVERAGE</span>
                <strong>Global view</strong>
                <small>Geographic data pending</small>
              </div>

              <div className="map-overlay bottom-right">
                <span className="map-overlay-label">INTELLIGENCE STATUS</span>
                <strong>Map visualization ready</strong>
                <small>Connect a geolocated incident source to display events.</small>
              </div>

              <div className="map-coordinate coordinate-one">N 40° 42′</div>
              <div className="map-coordinate coordinate-two">E 74° 00′</div>
            </div>

            <div className="map-footer">
              <span>
                <span className="legend-square legend-red" />
                Critical
              </span>
              <span>
                <span className="legend-square legend-orange" />
                High
              </span>
              <span>
                <span className="legend-square legend-yellow" />
                Medium
              </span>
              <span>
                <span className="legend-square legend-blue" />
                Low
              </span>
              <span className="map-footer-note">
                Severity legend · No geographic events plotted
              </span>
            </div>
          </section>

          <section className="bottom-grid">
            <article className="panel vulnerabilities-panel" id="vulnerabilities">
              <div className="section-heading table-heading">
                <div>
                  <div className="section-kicker">THREAT DATABASE</div>
                  <h2>Vulnerabilities</h2>
                  <p>Records retrieved from your RADAR database</p>
                </div>
                <span className="record-count">
                  {filteredCases.length} RECORDS
                </span>
              </div>

              <div className="filters">
                <label className="search-box">
                  <span>⌕</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search CVE, vendor or product..."
                    aria-label="Search vulnerabilities"
                  />
                  <kbd>⌘ K</kbd>
                </label>

                <select
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value)}
                  aria-label="Filter by severity"
                >
                  <option value="ALL">All severity</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>VULNERABILITY</th>
                      <th>SEVERITY</th>
                      <th>VENDOR / PRODUCT</th>
                      <th>DISCLOSED</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="empty-cell">
                          <span className="loading-spinner" />
                          Loading intelligence...
                        </td>
                      </tr>
                    ) : filteredCases.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="empty-cell">
                          {error
                            ? "Backend connection required."
                            : "No vulnerabilities match your filters."}
                        </td>
                      </tr>
                    ) : (
                      filteredCases.map((item) => (
                        <tr
                          key={item.id}
                          className="case-row"
                          onClick={() => setSelectedCase(item)}
                        >
                          <td>
                            <strong className="cve-id">
                              {item.cve_id || item.title}
                            </strong>
                            <span className="cve-description">
                              {item.summary || "No description available"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`severity-badge ${(item.severity || "unknown").toLowerCase()}`}
                            >
                              <span />
                              {severityLabel(item.severity)}
                            </span>
                          </td>
                          <td>
                            <span className="vendor-name">
                              {item.company || "Unknown vendor"}
                            </span>
                            <span className="product-name">
                              {item.product || "Unknown product"}
                            </span>
                          </td>
                          <td className="date-cell">
                            {formatDate(item.published_at)}
                          </td>
                          <td>
                            <button
                              className="row-action"
                              aria-label={`View ${item.cve_id || item.title}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedCase(item);
                              }}
                            >
                              ↗
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <span>
                  Showing {filteredCases.length} of {cases.length} records
                </span>
                <span>Source: NVD / RADAR database</span>
              </div>
            </article>

            <aside className="right-column">
              <article className="panel recent-panel">
                <div className="section-heading compact-heading">
                  <div>
                    <div className="section-kicker">LATEST RECORDS</div>
                    <h2>Recently published</h2>
                  </div>
                  <span className="recent-icon">↗</span>
                </div>

                <div className="recent-list">
                  {loading ? (
                    <p className="muted-message">Loading records...</p>
                  ) : latestCases.length === 0 ? (
                    <p className="muted-message">No records available yet.</p>
                  ) : (
                    latestCases.slice(0, 5).map((item) => (
                      <button
                        key={item.id}
                        className="recent-item"
                        onClick={() => setSelectedCase(item)}
                      >
                        <span
                          className={`recent-severity ${(item.severity || "unknown").toLowerCase()}`}
                        />
                        <span className="recent-copy">
                          <strong>{item.cve_id || item.title}</strong>
                          <small>{formatDate(item.published_at)}</small>
                        </span>
                        <span className="recent-arrow">↗</span>
                      </button>
                    ))
                  )}
                </div>
              </article>

              <article className="panel severity-panel">
                <div className="section-kicker">SEVERITY DISTRIBUTION</div>
                <h2>Risk breakdown</h2>

                {[
                  { label: "Critical", key: "CRITICAL", className: "critical" },
                  { label: "High", key: "HIGH", className: "high" },
                  { label: "Medium", key: "MEDIUM", className: "medium" },
                  { label: "Low", key: "LOW", className: "low" },
                ].map((item) => {
                  const count = countSeverity(item.key);
                  const percent =
                    cases.length > 0 ? (count / cases.length) * 100 : 0;

                  return (
                    <div className="risk-row" key={item.key}>
                      <div className="risk-label">
                        <span className={`risk-dot ${item.className}`} />
                        <span>{item.label}</span>
                        <strong>{loading ? "—" : count}</strong>
                      </div>
                      <div className="risk-track">
                        <div
                          className={`risk-fill ${item.className}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                <p className="risk-note">
                  Distribution reflects available CVSS severity classifications.
                </p>
              </article>
            </aside>
          </section>

          <section className="panel incidents-panel" id="incidents">
            <div className="section-heading">
              <div>
                <div className="section-kicker">SECURITY EVENTS</div>
                <h2>Incident intelligence</h2>
                <p>Verified incident data will appear here when a source is connected.</p>
              </div>
              <span className="coming-soon">SOURCE NOT CONNECTED</span>
            </div>
            <div className="incident-empty">
              <span className="incident-empty-icon">⌁</span>
              <strong>No incident feed connected yet</strong>
              <p>
                RADAR currently imports vulnerabilities from NVD. Incident
                reporting and geographic threat intelligence are separate
                integrations we can add next.
              </p>
            </div>
          </section>

          <footer className="dashboard-footer" id="sources">
            <span>
              <span className="footer-radar-dot" /> RADAR INTELLIGENCE
            </span>
            <span>Data shown reflects records currently available in your database.</span>
            <span>BUILD 0.1.0</span>
          </footer>
        </div>
      </section>

      {selectedCase && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setSelectedCase(null)}
        >
          <section
            className="case-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="case-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-top">
              <div className="section-kicker">VULNERABILITY DETAILS</div>
              <button
                className="modal-close"
                onClick={() => setSelectedCase(null)}
                aria-label="Close details"
              >
                ×
              </button>
            </div>

            <div className="modal-title-row">
              <h2 id="case-modal-title">
                {selectedCase.cve_id || selectedCase.title}
              </h2>
              <span
                className={`severity-badge ${(selectedCase.severity || "unknown").toLowerCase()}`}
              >
                <span />
                {severityLabel(selectedCase.severity)}
              </span>
            </div>

            <p className="modal-description">
              {selectedCase.summary || "No description is available for this record."}
            </p>

            <div className="detail-grid">
              <div>
                <span>VENDOR</span>
                <strong>{selectedCase.company || "Unknown"}</strong>
              </div>
              <div>
                <span>PRODUCT</span>
                <strong>{selectedCase.product || "Unknown"}</strong>
              </div>
              <div>
                <span>PUBLISHED</span>
                <strong>{formatDate(selectedCase.published_at)}</strong>
              </div>
              <div>
                <span>RADAR RECORD</span>
                <strong>#{selectedCase.id}</strong>
              </div>
            </div>

            {selectedCase.cve_id && (
              <a
                className="nvd-link"
                href={`https://nvd.nist.gov/vuln/detail/${encodeURIComponent(selectedCase.cve_id)}`}
                target="_blank"
                rel="noreferrer"
              >
                View official NVD record ↗
              </a>
            )}
          </section>
        </div>
      )}
    </main>
  );
}