/* eslint-disable @next/next/no-img-element -- Official SVG masters and the pre-rendered sponsor PNG are served directly by the static export. */
import MobileNavigation from "./MobileNavigation";

const purposeItems = [
  {
    number: "01",
    label: "Vision",
    statement:
      "To establish KTAF as a credible and recognized annual scientific forum connecting specialists involved in thrombosis prevention, diagnosis, and anticoagulation management.",
  },
  {
    number: "02",
    label: "Mission",
    statement:
      "To connect multidisciplinary expertise, advance evidence-based dialogue, and translate emerging scientific evidence and clinical guidelines into practical, patient-centered decisions across thrombosis and anticoagulation care.",
  },
  {
    number: "03",
    label: "Goal",
    statement:
      "To translate emerging evidence and guideline updates into practical, patient-centered decisions across thrombosis and anticoagulation care.",
  },
];

const focusAreas = [
  {
    number: "01",
    title: "Prevention & diagnosis",
    description:
      "Scientific dialogue around thrombosis prevention and diagnosis.",
  },
  {
    number: "02",
    title: "Anticoagulation management",
    description:
      "A practical focus on anticoagulation management across multidisciplinary care.",
  },
  {
    number: "03",
    title: "Evidence into practice",
    description:
      "Emerging evidence and guideline updates considered through the lens of practical, patient-centered decisions.",
  },
];

const conferenceDetails = [
  { label: "Date", value: "To be announced" },
  { label: "Venue", value: "To be announced" },
  { label: "Programme", value: "To be announced" },
  { label: "Participation", value: "Details to be announced" },
];

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="site-header">
        <div className="shell header-inner">
          <a className="brand" href="#top" aria-label="KTAF home">
            <picture>
              <source media="(max-width: 800px)" srcSet="/brand/ktaf-compact.svg" />
              <img
                src="/brand/ktaf-horizontal.svg"
                alt="Kurdistan Thrombosis and Anticoagulation Forum — KTAF"
                width="1600"
                height="520"
              />
            </picture>
          </a>

          <nav className="primary-nav" aria-label="Primary navigation">
            <a href="#purpose">Purpose</a>
            <a href="#focus">Scientific focus</a>
            <a className="nav-cta" href="#updates">
              Conference updates
            </a>
          </nav>

          <MobileNavigation />
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <img
            className="hero-flow"
            src="/brand/ktaf-flow-pattern.svg"
            alt=""
            width="1920"
            height="1080"
            aria-hidden="true"
          />

          <div className="shell hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">
                <span className="eyebrow-mark" aria-hidden="true" />
                Kurdistan&apos;s multidisciplinary scientific forum
              </p>

              <h1
                id="hero-title"
                aria-label="Kurdistan Thrombosis & Anticoagulation Forum — KTAF"
              >
                <span>Kurdistan</span>
                <span className="hero-accent">Thrombosis &amp;</span>
                <span className="hero-accent">Anticoagulation</span>
                <span>Forum — KTAF</span>
              </h1>

              <p className="tagline">Advancing Science. Improving Outcomes.</p>
              <p className="hero-intro">
                A scientific forum connecting specialists across thrombosis
                prevention, diagnosis, and anticoagulation management.
              </p>

              <div className="hero-actions" aria-label="Hero actions">
                <a className="button button-primary" href="#purpose">
                  Discover KTAF
                </a>
                <a className="button button-secondary" href="#updates">
                  Conference information
                </a>
              </div>
            </div>

            <aside className="hero-aside" aria-label="KTAF approach">
              <div className="approach-card">
                <div className="card-kicker">A connected approach</div>
                <ol>
                  <li>
                    <span className="approach-dot dot-blue" aria-hidden="true" />
                    <span>Multidisciplinary expertise</span>
                  </li>
                  <li>
                    <span className="approach-dot dot-red" aria-hidden="true" />
                    <span>Evidence-based dialogue</span>
                  </li>
                  <li>
                    <span className="approach-dot dot-navy" aria-hidden="true" />
                    <span>Patient-centered decisions</span>
                  </li>
                </ol>
              </div>
            </aside>
          </div>

          <div className="shell hero-foot">
            <span>01</span>
            <span className="hero-foot-line" aria-hidden="true" />
            <span>Forum purpose</span>
          </div>
        </section>

        <section className="intro-section" aria-labelledby="about-title">
          <div className="shell intro-grid">
            <div>
              <p className="section-label">About the forum</p>
              <h2 id="about-title">
                One focused scientific setting. Multiple perspectives.
              </h2>
            </div>
            <div className="intro-copy">
              <p>
                KTAF connects multidisciplinary expertise across thrombosis and
                anticoagulation care, creating space for rigorous scientific
                dialogue and practical clinical relevance.
              </p>
              <div className="intro-rule" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </section>

        <section className="purpose-section" id="purpose" aria-labelledby="purpose-title">
          <div className="shell">
            <div className="section-heading-row">
              <div>
                <p className="section-label">Our purpose</p>
                <h2 id="purpose-title">Science, dialogue, and practice—connected.</h2>
              </div>
              <p className="section-note">
                A clear foundation for a credible annual scientific forum.
              </p>
            </div>

            <div className="purpose-list">
              {purposeItems.map((item) => (
                <article className={`purpose-item purpose-${item.label.toLowerCase()}`} key={item.label}>
                  <div className="purpose-meta">
                    <span>{item.number}</span>
                    <h3>{item.label}</h3>
                  </div>
                  <p>{item.statement}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="translation-section" aria-labelledby="translation-title">
          <div className="shell translation-grid">
            <div className="translation-copy">
              <p className="section-label section-label-light">The KTAF continuum</p>
              <h2 id="translation-title">
                From emerging evidence to practical, patient-centered decisions.
              </h2>
            </div>

            <ol className="continuum" aria-label="KTAF continuum">
              <li>
                <span className="continuum-number">01</span>
                <span>Multidisciplinary expertise</span>
              </li>
              <li>
                <span className="continuum-number">02</span>
                <span>Evidence-based dialogue</span>
              </li>
              <li>
                <span className="continuum-number">03</span>
                <span>Practical decisions</span>
              </li>
            </ol>
          </div>
        </section>

        <section className="focus-section" id="focus" aria-labelledby="focus-title">
          <img
            className="focus-flow"
            src="/brand/ktaf-flow-pattern.svg"
            alt=""
            width="1920"
            height="1080"
            loading="lazy"
            aria-hidden="true"
          />
          <div className="shell focus-content">
            <div className="section-heading-row focus-heading">
              <div>
                <p className="section-label">Scientific focus</p>
                <h2 id="focus-title">One connected conversation across care.</h2>
              </div>
              <p className="section-note">
                Prevention, diagnosis, management, and the translation of
                evidence into practice.
              </p>
            </div>

            <div className="focus-grid">
              {focusAreas.map((area) => (
                <article className="focus-card" key={area.title}>
                  <span className="focus-number">{area.number}</span>
                  <h3>{area.title}</h3>
                  <p>{area.description}</p>
                  <span className="focus-marker" aria-hidden="true" />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="updates-section" id="updates" aria-labelledby="updates-title">
          <div className="shell updates-grid">
            <div className="updates-intro">
              <p className="section-label section-label-light">Conference information</p>
              <h2 id="updates-title">Details will be announced.</h2>
              <p>
                Confirmed conference information will be published here as it
                becomes available.
              </p>
            </div>

            <dl className="details-grid">
              {conferenceDetails.map((detail) => (
                <div key={detail.label}>
                  <dt>{detail.label}</dt>
                  <dd>{detail.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="sponsor-section" id="sponsor" aria-labelledby="sponsor-title">
          <div className="shell sponsor-grid">
            <div className="sponsor-copy">
              <p className="section-label">Conference partnership</p>
              <h2 id="sponsor-title">Exclusive sponsor</h2>
              <p className="sponsor-name">Denk Pharma</p>
            </div>

            <figure className="sponsor-mark">
              <img
                src="/brand/sponsors/denk-pharma-logo.png"
                alt="Denk Pharma"
                width="1679"
                height="1679"
                loading="lazy"
              />
              <figcaption>
                <strong>Denk Pharma</strong>
                <span>Exclusive sponsor</span>
              </figcaption>
            </figure>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell footer-grid">
          <div className="footer-brand">
            <img
              src="/brand/ktaf-monochrome-white.svg"
              alt=""
              width="520"
              height="520"
              aria-hidden="true"
            />
            <div>
              <strong>KTAF</strong>
              <span>Kurdistan Thrombosis &amp; Anticoagulation Forum</span>
            </div>
          </div>

          <p className="footer-tagline">Advancing Science. Improving Outcomes.</p>

          <nav className="footer-nav" aria-label="Footer navigation">
            <a href="#purpose">Purpose</a>
            <a href="#focus">Scientific focus</a>
            <a href="#updates">Conference information</a>
            <a href="#sponsor">Sponsor</a>
          </nav>

          <p className="footer-note">Conference details are subject to confirmation.</p>
        </div>
      </footer>
    </>
  );
}
