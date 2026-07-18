import Link from "next/link";
import {
  profile,
  achievements,
  experience,
  education,
  languages,
  milestones,
  projects,
  agents,
} from "../data/profile";

function Nav() {
  return (
    <nav>
      <div className="container nav-inner">
        <a href="#" className="nav-logo">
          {profile.name}
        </a>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#experience">Experience</a>
          <a href="#achievements">Achievements</a>
          <a href="#milestones">Milestones</a>
          <a href="#projects">Projects</a>
          <a href="#agents">AI Agents</a>
          <a href="#contact">Contact</a>
        </div>
      </div>
    </nav>
  );
}

function Experience() {
  return (
    <section id="experience">
      <div className="container">
        <h2 className="section-title">Professional <span>Experience</span></h2>
        <div className="experience-list">
          {experience.map((item) => (
            <article key={`${item.company}-${item.role}`} className="experience-card">
              <div className="experience-meta">
                <p className="year">{item.period}</p>
                <p>{item.company}</p>
              </div>
              <div>
                <h3>{item.role}</h3>
                <ul>{item.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Hero() {
  return (
    <header className="hero">
      <div className="container">
        <h1>
          Hi, I&apos;m <span>{profile.name}</span>
        </h1>
        <p className="role">{profile.role}</p>
        <p className="tagline">{profile.tagline}</p>
        <div className="hero-cta">
          <a href="#contact" className="btn btn-primary">
            Get in touch
          </a>
          <a href="#about" className="btn btn-outline">
            Learn more
          </a>
        </div>
      </div>
    </header>
  );
}

function About() {
  return (
    <section id="about">
      <div className="container">
        <h2 className="section-title">
          About <span>Me</span>
        </h2>
        <div className="about-grid">
          <div className="about-text">
            {profile.about.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <div>
            <p className="skills-title">Skills &amp; Tools</p>
            <div className="skills">
              {profile.skills.map((skill) => (
                <span key={skill} className="skill-tag">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Achievements() {
  return (
    <section id="achievements">
      <div className="container">
        <h2 className="section-title">
          <span>Achievements</span>
        </h2>
        <div className="card-grid">
          {achievements.map((item) => (
            <div key={item.title} className="card">
              <div className="year">{item.year}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Milestones() {
  return (
    <section id="milestones">
      <div className="container">
        <h2 className="section-title">
          My <span>Journey</span>
        </h2>
        <div className="timeline">
          {milestones.map((item) => (
            <div key={item.year + item.title} className="timeline-item">
              <div className="year">{item.year}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Education() {
  return (
    <section id="education">
      <div className="container">
        <h2 className="section-title"><span>Education</span> &amp; Languages</h2>
        <div className="card-grid">
          {education.map((item) => (
            <article key={item.degree} className="card">
              <div className="year">{item.period}</div>
              <h3>{item.degree}</h3>
              <p>{item.institution}</p>
              <p className="education-detail">{item.detail}</p>
            </article>
          ))}
          <article className="card">
            <h3>Languages</h3>
            <div className="tags">{languages.map((language) => <span key={language}>{language}</span>)}</div>
          </article>
        </div>
      </div>
    </section>
  );
}

function Projects() {
  if (!projects.length) return null;
  return (
    <section id="projects">
      <div className="container">
        <h2 className="section-title">
          Notable <span>Work</span>
        </h2>
        <div className="card-grid">
          {projects.map((item) => (
            <div key={item.title} className="card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className="tags">
                {item.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              {item.url && (
                <a
                  className="project-link"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View project &rarr;
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Agents() {
  if (!agents.length) return null;
  return (
    <section id="agents">
      <div className="container">
        <h2 className="section-title">
          AI <span>Agents</span>
        </h2>
        <p className="agents-intro">
          Interactive AI tools I&apos;ve built for real-world data and analytics workflows. Try them live.
        </p>
        <div className="card-grid">
          {agents.map((agent) => (
            <div key={agent.id} className="card agent-card">
              <span className="agent-status">{agent.status}</span>
              <h3>{agent.title}</h3>
              <p className="agent-subtitle">{agent.subtitle}</p>
              <p>{agent.description}</p>
              <div className="tags">
                {agent.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <Link className="agent-cta" href={`/agents/${agent.id}`}>
                Try it live &rarr;
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="contact">
      <div className="container">
        <h2 className="section-title">
          Get in <span>Touch</span>
        </h2>
        <p>
          Want to work together, or just say hello? My inbox is always open.
        </p>
        <a href={`mailto:${profile.email}`} className="btn btn-primary">
          {profile.email}
        </a>
        <div className="contact-socials">
          {profile.socials.map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="container">
        &copy; {new Date().getFullYear()} {profile.name}. Built with Next.js.
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <About />
      <Experience />
      <Achievements />
      <Milestones />
      <Education />
      <Projects />
      <Agents />
      <Contact />
      <Footer />
    </>
  );
}
