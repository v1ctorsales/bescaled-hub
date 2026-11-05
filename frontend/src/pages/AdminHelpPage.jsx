import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { ADMIN_HELP_TOPICS } from "../data/adminHelp";
import "./AdminHelpPage.css";

export default function AdminHelpPage() {
  const [query, setQuery] = useState("");
  const [activeTopicId, setActiveTopicId] = useState(null);
  const topicsRef = useRef(null);
  const search = query.trim().toLowerCase();
  const topics = ADMIN_HELP_TOPICS.filter((topic) =>
    [topic.group ?? "", topic.title, topic.summary, ...(topic.steps ?? []), ...topic.paragraphs]
      .join(" ").toLowerCase().includes(search),
  );
  const topicIds = topics.map((topic) => topic.id).join(",");

  useEffect(() => {
    const updateActiveTopic = () => {
      const sections = topicsRef.current?.querySelectorAll(".admin-help__topic");
      if (!sections?.length) {
        setActiveTopicId(null);
        return;
      }

      const atPageBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      const currentSection = atPageBottom
        ? sections[sections.length - 1]
        : [...sections].filter((section) => section.getBoundingClientRect().top <= 160).at(-1);
      setActiveTopicId(currentSection?.id ?? null);
    };

    updateActiveTopic();
    window.addEventListener("scroll", updateActiveTopic, { passive: true });
    window.addEventListener("resize", updateActiveTopic);
    return () => {
      window.removeEventListener("scroll", updateActiveTopic);
      window.removeEventListener("resize", updateActiveTopic);
    };
  }, [topicIds]);

  return (
    <div className="page">
      <Header subtitle="Admin · Platform Guide" />
      <main className="page__content admin-help">
        <Link className="back-link" to="/admin">← Back to companies</Link>
        <section className="admin-help__intro" aria-labelledby="help-title">
          <p className="admin-help__eyebrow">BeScaled Hub</p>
          <h1 id="help-title">Platform Guide</h1>
          <label className="admin-help__search">
            <span>Search help</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="Try login emails, batch dates, or exports"
              aria-controls="help-topics" />
          </label>
          <p className="admin-help__count" role="status">
            {topics.length} {topics.length === 1 ? "topic" : "topics"}{search ? " found" : " available"}
          </p>
        </section>
        <div className="admin-help__layout">
          <nav className="admin-help__nav" aria-label="Help topics">
            <h2>On this page</h2>
            {topics.map((topic, index) => (
              <Fragment key={topic.id}>
              {topic.group && topic.group !== topics[index - 1]?.group && (
                <p className="admin-help__nav-group">{topic.group}</p>
              )}
              <a
                href={`#${topic.id}`}
                className={activeTopicId === topic.id ? "is-active" : undefined}
                aria-current={activeTopicId === topic.id ? "location" : undefined}
              >
                {topic.title}
              </a>
              </Fragment>
            ))}
            {search && <button type="button" className="btn-link" onClick={() => setQuery("")}>Clear search</button>}
          </nav>
          <div id="help-topics" className="admin-help__topics" ref={topicsRef}>
            {topics.length === 0 && (
              <section className="panel">
                <h2>No matching topics</h2>
                <p>Try a shorter phrase such as “email”, “score”, or “Slack”, or clear the search to see all topics.</p>
              </section>
            )}
            {topics.map((topic, index) => (
              <Fragment key={topic.id}>
              {topic.group && topic.group !== topics[index - 1]?.group && (
                <h2 className="admin-help__group-title">{topic.group}</h2>
              )}
              <section id={topic.id} className="panel admin-help__topic" aria-labelledby={`${topic.id}-title`}>
                {topic.group
                  ? <h3 id={`${topic.id}-title`}>{topic.title}</h3>
                  : <h2 id={`${topic.id}-title`}>{topic.title}</h2>}
                <p className="admin-help__summary">{topic.summary}</p>
                {topic.steps && <ol>{topic.steps.map((step) => <li key={step}>{step}</li>)}</ol>}
                {topic.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {topic.screenshots?.map((screenshot) => (
                  <figure key={screenshot.src} className="admin-help__figure">
                    <a href={screenshot.src} target="_blank" rel="noopener noreferrer"
                      aria-label={`${screenshot.alt} — open full-size screenshot in a new tab`}>
                      <img src={screenshot.src} alt={screenshot.alt} width={screenshot.width}
                        height={screenshot.height} loading="lazy" decoding="async" />
                    </a>
                    <figcaption>{screenshot.caption}</figcaption>
                  </figure>
                ))}
              </section>
              </Fragment>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
