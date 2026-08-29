/* eslint-disable @next/next/no-img-element -- Official SVG masters and the pre-rendered sponsor PNG are served directly by the static export. */
import MobileNavigation from "./MobileNavigation";
import RegistrationSection from "./RegistrationSection";
import "./conference-information.css";

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
  { label: "Year", value: "2026" },
  { label: "City", value: "Sulaymaniyah" },
  { label: "Venue", value: "Slemani Rotana" },
  { label: "Meeting room", value: "Almas 1" },
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
            <a href="#updates">Information</a>
            <a href="#speakers">Faculty</a>
            <a className="nav-cta" href="#register">
              Register
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
                <a className="button button-primary" href="#register">
                  Register to attend
                </a>
                <a className="button button-secondary" href="#purpose">
                  Discover KTAF
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
          <div className="shell">
            <div className="updates-grid">
              <div className="updates-intro">
                <p className="section-label section-label-light">
                  Conference information
                </p>
                <h2 id="updates-title">Confirmed details, with more to come.</h2>
                <p>
                  KTAF will take place in Sulaymaniyah in 2026. The exact date
                  and complete scientific programme will be published as final
                  confirmations are made.
                </p>
              </div>

              <div className="updates-details-panel">
                <dl className="details-grid">
                  {conferenceDetails.map((detail) => (
                    <div key={detail.label}>
                      <dt>{detail.label}</dt>
                      <dd>{detail.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="venue-note">
                  <div>
                    <span>Venue confirmed</span>
                    <p>Slemani Rotana · Almas 1 meeting room</p>
                  </div>
                  <a
                    href="https://www.rotana.com/rotanahotelandresorts/iraq/sulaymaniyah/slemanirotana/meetingsandevents"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Explore the venue <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="speakers-heading" id="speakers">
              <p className="section-label section-label-light">
                Conference leadership &amp; faculty
              </p>
              <p>
                Meet the confirmed chair and speakers shaping KTAF&apos;s
                multidisciplinary scientific conversation.
              </p>
            </div>

            <article className="speaker-feature" aria-labelledby="aram-baram-name">
              <figure className="speaker-portrait">
                <div className="speaker-portrait-frame">
                  <img
                    src="/speakers/dr-aram-baram.jpg"
                    alt="Professor Dr. Aram Baram Mohammed"
                    width="323"
                    height="425"
                    loading="lazy"
                  />
                  <span className="speaker-index" aria-hidden="true">
                    01
                  </span>
                </div>
                <figcaption>Conference chairman</figcaption>
              </figure>

              <div className="speaker-profile">
                <p className="speaker-role">Conference Chairman</p>
                <h3 id="aram-baram-name">Prof. Dr. Aram Baram Mohammed</h3>
                <p className="speaker-credentials">
                  MD · MRCSEd · FACS · AFS CTS
                </p>

                <div className="speaker-appointments" aria-label="Appointments">
                  <span>Professor, University of Sulaimani</span>
                  <span>Consultant Cardiothoracic &amp; Vascular Surgeon</span>
                </div>

                <p className="speaker-bio">
                  Professor at the University of Sulaimani College of Medicine
                  and consultant cardiothoracic and vascular surgeon. His
                  academic profile lists leadership responsibilities across the
                  cardiothoracic surgery unit, the Sulaimani Center for
                  Cardiothoracic Training, and the KBMS programme in
                  cardiothoracic and vascular surgery.
                </p>

                <div
                  className="speaker-topic speaker-topic-group"
                  aria-label="Current programme topics"
                >
                  <span>Current programme topics</span>
                  <div className="speaker-topic-entry">
                    <strong>Opening address</strong>
                    <p>
                      Anticoagulation Across Specialties—Balancing Thrombosis
                      and Bleeding
                    </p>
                  </div>
                  <div className="speaker-topic-entry">
                    <strong>Scientific presentation</strong>
                    <p>
                      Apixaban Across the VTE Continuum: Treatment and Secondary
                      Prevention of DVT and PE
                    </p>
                  </div>
                  <small>Subject to programme updates</small>
                </div>

                <a
                  className="speaker-profile-link"
                  href="https://sites.google.com/a/univsul.edu.iq/aram-baram/academic-profile"
                  target="_blank"
                  rel="noreferrer"
                >
                  View academic profile <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>

            <article
              className="speaker-feature speaker-feature-reverse"
              aria-labelledby="dana-omar-name"
            >
              <figure className="speaker-portrait">
                <div className="speaker-portrait-frame">
                  <img
                    src="/speakers/dr-dana-omar-karim.webp"
                    alt="Dr. Dana Omar Karim"
                    width="646"
                    height="850"
                    loading="lazy"
                  />
                  <span className="speaker-index" aria-hidden="true">
                    02
                  </span>
                </div>
                <figcaption>Conference speaker</figcaption>
              </figure>

              <div className="speaker-profile">
                <p className="speaker-role">Conference Speaker</p>
                <h3 id="dana-omar-name">Dr. Dana Omar Karim</h3>
                <p className="speaker-credentials">
                  M.B.Ch.B · Hematology &amp; Lymphoma Specialist
                </p>

                <div className="speaker-appointments" aria-label="Appointments">
                  <span>Senior Hematologist, Hiwa Hospital</span>
                  <span>Hematology Specialist, Smart Health Tower</span>
                </div>

                <p className="speaker-bio">
                  Dr. Dana Omar Karim is a senior hematologist at Hiwa Hospital
                  and a hematology and lymphoma specialist at Smart Health
                  Tower. He earned his M.B.Ch.B in Medicine from the University
                  of Sulaimani, and his published professional profile includes
                  scientific work across hematologic disorders and lymphoid
                  malignancies.
                </p>

                <div className="speaker-profile-links">
                  <a
                    className="speaker-profile-link"
                    href="https://smarthealth.group/ar/doctor-profile/113"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View clinical profile <span aria-hidden="true">↗</span>
                  </a>
                  <a
                    className="speaker-profile-link"
                    href="https://www.linkedin.com/in/dana-omar-a8b47534/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View LinkedIn <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </article>

            <article
              className="speaker-feature"
              aria-labelledby="sarkawt-dawood-name"
            >
              <figure className="speaker-portrait">
                <div className="speaker-portrait-frame">
                  <img
                    src="/speakers/dr-sarkawt-dawood-abbas.webp"
                    alt="Dr. Sarkawt Dawood Abbas"
                    width="646"
                    height="850"
                    loading="lazy"
                  />
                  <span className="speaker-index" aria-hidden="true">
                    03
                  </span>
                </div>
                <figcaption>Conference speaker</figcaption>
              </figure>

              <div className="speaker-profile">
                <p className="speaker-role">Conference Speaker</p>
                <h3 id="sarkawt-dawood-name">Dr. Sarkawt Dawood Abbas</h3>
                <p className="speaker-credentials">
                  Interventional Cardiologist
                </p>

                <div className="speaker-appointments" aria-label="Specialty">
                  <span>Coronary Intervention</span>
                  <span>Peripheral Vascular Intervention</span>
                </div>

                <p className="speaker-bio">
                  Dr. Sarkawt Dawood Abbas is an interventional cardiologist in
                  Sulaymaniyah. His professional clinic profile highlights a
                  focus on catheter-based coronary and peripheral vascular
                  intervention.
                </p>

                <div
                  className="speaker-topic"
                  aria-label="Current programme topic"
                >
                  <span>Current programme topic</span>
                  <p>
                    Atrial Fibrillation in 2026: Correct DOAC Dosing,
                    Device-Detected AF, and Antithrombotic Simplification After
                    PCI
                  </p>
                  <small>Subject to programme updates</small>
                </div>

                <div className="speaker-profile-links">
                  <a
                    className="speaker-profile-link"
                    href="https://www.facebook.com/Dr.Sarkawt.Dawood.clinic"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View professional profile <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </article>

            <article
              className="speaker-feature speaker-feature-reverse"
              aria-labelledby="zana-abdulrahman-name"
            >
              <figure className="speaker-portrait">
                <div className="speaker-portrait-frame">
                  <img
                    src="/speakers/dr-zana-abdulrahman.webp"
                    alt="Dr. Zana Abdulrahman"
                    width="646"
                    height="850"
                    loading="lazy"
                  />
                  <span className="speaker-index" aria-hidden="true">
                    04
                  </span>
                </div>
                <figcaption>Conference speaker</figcaption>
              </figure>

              <div className="speaker-profile">
                <p className="speaker-role">Conference Speaker</p>
                <h3 id="zana-abdulrahman-name">Dr. Zana Abdulrahman</h3>
                <p className="speaker-credentials">Neurologist</p>

                <div
                  className="speaker-appointments"
                  aria-label="Specialty and location"
                >
                  <span>Neurology</span>
                  <span>Sulaymaniyah</span>
                </div>

                <p className="speaker-bio">
                  Dr. Zana Abdulrahman is a neurologist based in Sulaymaniyah.
                  His public professional page identifies neurology as his
                  clinical specialty.
                </p>

                <div className="speaker-profile-links">
                  <a
                    className="speaker-profile-link"
                    href="https://www.facebook.com/Dr.ZanaA/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View professional profile <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </article>
          </div>
        </section>

        <RegistrationSection />

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

      <footer className="site-footer" id="contact">
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
            <a href="#speakers">Faculty</a>
            <a href="#register">Register</a>
            <a href="#sponsor">Sponsor</a>
          </nav>

          <div className="footer-contact">
            <span>Contact KTAF</span>
            <a href="mailto:contact@ktaf.krd">contact@ktaf.krd</a>
            <a className="footer-portal-link" href="/admin.html">
              Team registration portal
            </a>
            <p>Conference details are subject to confirmation.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
