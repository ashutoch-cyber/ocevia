import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import {
  filterSearchItems,
  getCategoryLabel,
  getInitialSearchIndex,
  loadSearchIndex,
  type SearchItem,
} from "@/lib/searchIndex";

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const [allItems, setAllItems] = useState<SearchItem[]>(() => getInitialSearchIndex());
  const [isLoading, setIsLoading] = useState(true);

  const query = (searchParams.get("q") || "").trim();

  useEffect(() => {
    let mounted = true;

    loadSearchIndex()
      .then((items) => {
        if (!mounted) {
          return;
        }
        setAllItems(items);
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const results = useMemo(() => {
    return filterSearchItems(allItems, query, 100);
  }, [allItems, query]);

  return (
    <div className="min-h-screen bg-background font-body selection:bg-secondary/30">
      <Navbar />
      <main className="pb-16">
        <section className="page-container">
          <div className="max-w-3xl mb-8">
            <h1 className="font-heading font-bold text-4xl md:text-6xl text-primary mb-4 tracking-[-0.02em]">
              Search Results
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Showing matches for "{query || ""}".
            </p>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Loading search index...</p>
          ) : null}

          {!isLoading && query && results.length === 0 ? (
            <div className="bg-card border border-secondary/30 rounded-2xl p-6 text-left">
              <h2 className="font-heading font-semibold text-xl text-primary mb-2">No matches found</h2>
              <p className="text-muted-foreground">
                Try a different term like a coastal location, ocean metric, dataset, or risk keyword.
              </p>
            </div>
          ) : null}

          {!isLoading && results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {results.map((result) => (
                <Link
                  key={result.id}
                  to={result.path}
                  className="block bg-card border border-secondary/30 rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition-shadow"
                >
                  <p className="text-xs uppercase tracking-wide text-secondary font-semibold mb-1">
                    {getCategoryLabel(result.category)}
                  </p>
                  <h2 className="font-heading font-bold text-xl text-primary mb-1">{result.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.description}</p>
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
