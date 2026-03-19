export type SearchCategory = "location" | "metric" | "data-source" | "risk-analysis" | "keyword";

export interface SearchItem {
  id: string;
  title: string;
  description: string;
  category: SearchCategory;
  path: string;
  keywords: string[];
}

const API_BASE_URL = "http://127.0.0.1:8000/api";

const staticSearchItems: SearchItem[] = [
  {
    id: "city-mumbai",
    title: "Mumbai Coast",
    description: "Coastal city risk context for Mumbai region.",
    category: "location",
    path: "/risk-map?focus=Mumbai%20Coast",
    keywords: ["mumbai", "coastal city", "port", "india", "arabian sea"],
  },
  {
    id: "city-chennai",
    title: "Chennai Coast",
    description: "Bay of Bengal coastal monitoring zone near Chennai.",
    category: "location",
    path: "/risk-map?focus=Chennai%20Coast",
    keywords: ["chennai", "coastal city", "port", "bay of bengal", "india"],
  },
  {
    id: "city-singapore",
    title: "Singapore Port",
    description: "High-traffic marine transport and port operations region.",
    category: "location",
    path: "/risk-map?focus=Singapore%20Port",
    keywords: ["singapore", "port", "marine region", "shipping"],
  },
  {
    id: "region-bay-of-bengal",
    title: "Bay of Bengal",
    description: "Marine region with high cyclone and storm surge exposure.",
    category: "location",
    path: "/risk-map?focus=Bay%20of%20Bengal",
    keywords: ["bay of bengal", "marine region", "coastal risk", "storm surge"],
  },
  {
    id: "metric-sea-temperature",
    title: "Sea Temperature",
    description: "Ocean surface temperature trend from insights.",
    category: "metric",
    path: "/#insights",
    keywords: ["temperature", "sst", "sea surface temperature", "ocean heat"],
  },
  {
    id: "metric-wave-height",
    title: "Wave Height",
    description: "Wave height distribution for coastal stability analysis.",
    category: "metric",
    path: "/#insights",
    keywords: ["wave", "wave height", "swell", "marine conditions"],
  },
  {
    id: "metric-storm-surge",
    title: "Storm Surge",
    description: "Storm surge vulnerability indicator for coastlines.",
    category: "metric",
    path: "/risk-map",
    keywords: ["storm surge", "extreme weather", "flooding", "surge"],
  },
  {
    id: "metric-wind-speed",
    title: "Wind Speed",
    description: "Wind speed trend used in risk scoring.",
    category: "metric",
    path: "/#insights",
    keywords: ["wind", "wind speed", "gust", "marine weather"],
  },
  {
    id: "dataset-copernicus",
    title: "Copernicus Marine",
    description: "Satellite-based oceanographic dataset provider.",
    category: "data-source",
    path: "/data-sources",
    keywords: ["copernicus", "dataset", "data source", "oceanographic"],
  },
  {
    id: "dataset-noaa",
    title: "NOAA",
    description: "Ocean and atmospheric observations for coastal intelligence.",
    category: "data-source",
    path: "/data-sources",
    keywords: ["noaa", "dataset", "weather", "marine"],
  },
  {
    id: "dataset-nasa",
    title: "NASA Earth Data",
    description: "Earth observation feeds for climate and marine analysis.",
    category: "data-source",
    path: "/data-sources",
    keywords: ["nasa", "earth data", "dataset", "satellite"],
  },
  {
    id: "risk-coastal-zone",
    title: "Coastal Zone Analysis",
    description: "Spatial coastal risk interpretation and hotspot detection.",
    category: "risk-analysis",
    path: "/risk-map",
    keywords: ["coastal zone", "analysis", "hotspot", "risk map"],
  },
  {
    id: "risk-risk-score",
    title: "Risk Scores",
    description: "Computed ocean risk score summaries by location.",
    category: "risk-analysis",
    path: "/risk-map",
    keywords: ["risk score", "risk level", "high risk", "low risk"],
  },
  {
    id: "keyword-ocean-intelligence",
    title: "Ocean Risk Intelligence",
    description: "Platform-wide indexed ocean risk keywords and entities.",
    category: "keyword",
    path: "/",
    keywords: ["ocean", "coastal", "marine", "intelligence", "neer"],
  },
];

const categoryLabelMap: Record<SearchCategory, string> = {
  location: "Location",
  metric: "Metric",
  "data-source": "Data Source",
  "risk-analysis": "Risk Analysis",
  keyword: "Keyword",
};

let cachedSearchIndex: SearchItem[] | null = null;
let cachedSearchIndexPromise: Promise<SearchItem[]> | null = null;

interface LoadSearchIndexOptions {
  includeHeavy?: boolean;
  forceRefresh?: boolean;
}

function toTitleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function fetchJsonWithTimeout(url: string, timeoutMs = 1500) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { signal: controller.signal }).finally(() => {
    window.clearTimeout(timeout);
  });
}

export function getInitialSearchIndex() {
  return staticSearchItems;
}

export async function loadSearchIndex(options: LoadSearchIndexOptions = {}): Promise<SearchItem[]> {
  const { includeHeavy = false, forceRefresh = false } = options;

  if (!forceRefresh && cachedSearchIndex) {
    return cachedSearchIndex;
  }

  if (!forceRefresh && cachedSearchIndexPromise) {
    return cachedSearchIndexPromise;
  }

  cachedSearchIndexPromise = buildSearchIndex(includeHeavy)
    .then((items) => {
      cachedSearchIndex = items;
      return items;
    })
    .finally(() => {
      cachedSearchIndexPromise = null;
    });

  return cachedSearchIndexPromise;
}

async function buildSearchIndex(includeHeavy: boolean): Promise<SearchItem[]> {
  const dynamicItems: SearchItem[] = [];

  try {
    const [searchResponse, dataSourcesResponse] = await Promise.all([
      fetchJsonWithTimeout(`${API_BASE_URL}/search/?query=`),
      fetchJsonWithTimeout(`${API_BASE_URL}/data-sources/`),
    ]);

    if (searchResponse.ok) {
      const searchPayload = await searchResponse.json();
      const apiResults = Array.isArray(searchPayload?.results) ? searchPayload.results : [];

      apiResults
        .filter((item) => {
          const type = safeString(item?.type).toLowerCase();
          return type !== "alert" && type !== "alerts";
        })
        .forEach((item, index) => {
          const type = safeString(item?.type).toLowerCase();
          const title = safeString(item?.name);
          const risk = safeString(item?.risk);

          if (!title) {
            return;
          }

          const category: SearchCategory = type === "location" ? "location" : "keyword";
          const description = risk
            ? `${title} - Risk level ${risk}.`
            : `Indexed ${toTitleCase(type || "keyword")} entity from ocean data.`;

          dynamicItems.push({
            id: `api-search-${index}-${title.toLowerCase().replace(/\s+/g, "-")}`,
            title,
            description,
            category,
            path: category === "location" ? `/risk-map?focus=${encodeURIComponent(title)}` : "/",
            keywords: [title.toLowerCase(), type, risk.toLowerCase()].filter(Boolean),
          });
        });
    }

    if (includeHeavy) {
      const riskResponse = await fetchJsonWithTimeout(`${API_BASE_URL}/risk/`, 2000);

      if (!riskResponse.ok) {
        return dedupeSearchItems([...dynamicItems, ...staticSearchItems]);
      }

      const riskPayload = await riskResponse.json();
      const riskPoints = Array.isArray(riskPayload) ? riskPayload : [];

      riskPoints.slice(0, 80).forEach((point, index) => {
        const lat = Number(point?.lat);
        const lng = Number(point?.lng);
        const level = safeString(point?.risk || point?.level || "unknown");
        const temp = Number(point?.temp);
        const wind = Number(point?.wind);
        const humidity = Number(point?.humidity);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return;
        }

        dynamicItems.push({
          id: `api-risk-${index}`,
          title: `Risk Point (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
          description: `Coastal zone analysis result with ${level} risk score.${
            Number.isFinite(temp) ? ` Sea temperature ${temp.toFixed(1)}C.` : ""
          }${Number.isFinite(wind) ? ` Wave-related wind ${wind.toFixed(1)} m/s.` : ""}${
            Number.isFinite(humidity) ? ` Humidity ${humidity.toFixed(0)}%.` : ""
          }`,
          category: "risk-analysis",
          path: `/risk-map?lat=${lat}&lng=${lng}`,
          keywords: [
            "coastal zone",
            "risk score",
            level.toLowerCase(),
            "sea temperature",
            "wave height",
            "storm surge",
          ],
        });
      });
    }

    if (dataSourcesResponse.ok) {
      const dataSourcesPayload = await dataSourcesResponse.json();
      const dataSourceItems = Array.isArray(dataSourcesPayload)
        ? dataSourcesPayload
        : Array.isArray(dataSourcesPayload?.data)
        ? dataSourcesPayload.data
        : [];

      dataSourceItems.forEach((source, index) => {
        const name = safeString(source);
        if (!name) {
          return;
        }

        dynamicItems.push({
          id: `api-source-${index}-${name.toLowerCase().replace(/\s+/g, "-")}`,
          title: name,
          description: `${name} dataset available in integrated data sources.`,
          category: "data-source",
          path: "/data-sources",
          keywords: [name.toLowerCase(), "dataset", "marine data", "ocean data"],
        });
      });
    }
  } catch {
    return dedupeSearchItems([...dynamicItems, ...staticSearchItems]);
  }

  return dedupeSearchItems([...dynamicItems, ...staticSearchItems]);
}

function dedupeSearchItems(items: SearchItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.category}:${item.title.toLowerCase()}:${item.path}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getScore(item: SearchItem, query: string) {
  const normalizedQuery = query.toLowerCase();
  const title = item.title.toLowerCase();
  const description = item.description.toLowerCase();
  const category = item.category.toLowerCase();
  const keywords = item.keywords.join(" ").toLowerCase();

  let score = 0;

  if (title === normalizedQuery) score += 100;
  if (title.startsWith(normalizedQuery)) score += 70;
  if (title.includes(normalizedQuery)) score += 50;
  if (description.includes(normalizedQuery)) score += 30;
  if (keywords.includes(normalizedQuery)) score += 40;
  if (category.includes(normalizedQuery)) score += 15;

  return score;
}

export function filterSearchItems(items: SearchItem[], query: string, limit = 10): SearchItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return items
    .map((item) => ({ item, score: getScore(item, normalizedQuery) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item);
}

export function getCategoryLabel(category: SearchCategory) {
  return categoryLabelMap[category] ?? "Result";
}
