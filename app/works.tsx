import { memo, useId } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { ArrowUpRight } from 'lucide-react';
import { portfolio as defaultPortfolio } from './profile';

// Keep the table independent of the audio player's frequent progress updates.
export const Works = memo(function Works({
  collection = defaultPortfolio,
}: {
  collection?: typeof defaultPortfolio;
}) {
  const portfolio = collection;
  const headingId = useId();
  if (!portfolio.enabled || !portfolio.categories.length) return null;

  return (
    <section className="works" aria-labelledby={headingId}>
      <header className="works-heading">
        <h2 id={headingId}>{portfolio.title}</h2>
        <p>{portfolio.description}</p>
      </header>
      <Tabs.Root
        defaultValue={portfolio.categories[0].id}
        orientation="vertical"
        className="works-layout"
      >
        <Tabs.List className="works-tabs" aria-label="Werke nach Kategorie">
          {portfolio.categories.map((category) => {
            const count = portfolio.works.filter(
              (work) => category.id === 'alle' || work.category === category.id,
            ).length;
            return (
              <Tabs.Tab
                key={category.id}
                value={category.id}
                className="works-tab"
              >
                <span>{category.label}</span>
                <span className="work-count">{count}</span>
              </Tabs.Tab>
            );
          })}
        </Tabs.List>
        {portfolio.categories.map((category) => {
          const works = portfolio.works.filter(
            (work) => category.id === 'alle' || work.category === category.id,
          );
          return (
            <Tabs.Panel
              key={category.id}
              value={category.id}
              className="works-panel"
            >
              {works.length ? (
                <div className="works-scroll">
                  <table className="works-table">
                    <caption className="sr-only">{category.label}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Task</th>
                        <th scope="col">Year</th>
                        <th scope="col">
                          <span className="sr-only">Link</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {works.map((work, index) => (
                        <tr key={`${work.title}-${index}`}>
                          <td>
                            <strong>{work.title}</strong>
                            <p>{work.description}</p>
                          </td>
                          <td className="work-year">{work.year}</td>
                          <td>
                            {work.url ? (
                              <a
                                className="work-link"
                                href={work.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${work.title} öffnen (neuer Tab)`}
                                title="Werk öffnen"
                              >
                                <ArrowUpRight size={19} />
                              </a>
                            ) : (
                              <span
                                className="work-no-link"
                                aria-label="Kein Link hinterlegt"
                              >
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="works-empty">
                  Hier sind noch keine Werke eingetragen.
                </p>
              )}
            </Tabs.Panel>
          );
        })}
      </Tabs.Root>
    </section>
  );
});
