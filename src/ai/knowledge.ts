import type { RetrievedChunk, SiteId, SiteNotes, Source } from './types';

/**
 * Curated, citable NISAR/SAR facts used when a full vector index is not
 * available. The retriever is deliberately small and deterministic: it keeps
 * the chatbot grounded without shipping an embedding model to the browser.
 */
export const SOURCES: Source[] = [
  {
    id: 'nisar-mission',
    title: 'NASA — NISAR Mission Overview',
    url: 'https://nisar.jpl.nasa.gov/mission/overview/',
    attribution: 'NASA/JPL-Caltech',
  },
  {
    id: 'nisar-data',
    title: 'NASA — NISAR Data Products',
    url: 'https://nisar.jpl.nasa.gov/data/',
    attribution: 'NASA/JPL-Caltech',
  },
  {
    id: 'nisar-applications',
    title: 'NASA — NISAR Applications',
    url: 'https://nisar.jpl.nasa.gov/applications/',
    attribution: 'NASA/JPL-Caltech',
  },
  {
    id: 'nasa-sar',
    title: 'NASA Earthdata — What is SAR?',
    url: 'https://www.earthdata.nasa.gov/learn/backgrounders/what-is-sar',
    attribution: 'NASA Earthdata',
  },
];

interface KnowledgeChunk {
  id: string;
  sourceId: string;
  section: string;
  page: number | null;
  text: string;
  keywords: string[];
}

const CHUNKS: KnowledgeChunk[] = [
  {
    id: 'nisar-1',
    sourceId: 'nisar-mission',
    section: 'Mission overview',
    page: null,
    text: 'NISAR is a joint NASA–ISRO Earth-observation mission. Its radar payload carries an L-band system at about 24 cm wavelength and an S-band system at about 10 cm wavelength. L-band is especially useful for penetrating vegetation canopies and seeing the ground beneath them; S-band provides complementary sensitivity to vegetation and surface properties.',
    keywords: ['nisar', 'nasa', 'isro', 'l-band', 's-band', 'wavelength', 'radar', 'mission'],
  },
  {
    id: 'nisar-2',
    sourceId: 'nisar-mission',
    section: 'Revisit and coverage',
    page: null,
    text: 'NISAR is designed for frequent global coverage, with a 12-day repeat cycle and a swath of roughly 240 km for its main radar modes. The repeated observations support time-series change detection rather than one-off snapshots.',
    keywords: ['revisit', 'repeat', '12-day', 'swath', '240', 'coverage', 'time series'],
  },
  {
    id: 'nisar-3',
    sourceId: 'nisar-data',
    section: 'Data products',
    page: null,
    text: 'NISAR data products include radar imagery and interferometric products such as GSLC, GCOV, GUNW, GOFF, and RSLC. Interferometric products support measurements of surface displacement and coherence between acquisitions; coherence describes how consistently the surface scattered radar energy between passes.',
    keywords: ['products', 'gslc', 'gcov', 'gunw', 'goff', 'rslc', 'interferometry', 'coherence', 'displacement'],
  },
  {
    id: 'nisar-4',
    sourceId: 'nisar-applications',
    section: 'Applications',
    page: null,
    text: 'NISAR observations support research and monitoring of earthquakes, volcanoes, landslides, land subsidence, glaciers and ice sheets, soil moisture, agriculture, wetlands, and coastal change. These are research and demonstration applications, not operational safety certifications or evacuation products.',
    keywords: ['earthquake', 'volcano', 'landslide', 'subsidence', 'glacier', 'ice', 'soil moisture', 'agriculture', 'wetland', 'coastal'],
  },
  {
    id: 'sar-1',
    sourceId: 'nasa-sar',
    section: 'SAR fundamentals',
    page: null,
    text: 'Synthetic Aperture Radar (SAR) sends its own microwave signal and records the backscatter. Unlike optical cameras, radar can operate day or night and is not blocked by clouds or smoke. The return depends on surface roughness, geometry, and the dielectric constant, which increases with water content.',
    keywords: ['sar', 'synthetic aperture radar', 'backscatter', 'cloud', 'smoke', 'night', 'roughness', 'dielectric', 'water'],
  },
  {
    id: 'sar-2',
    sourceId: 'nasa-sar',
    section: 'Interpreting SAR',
    page: null,
    text: 'Bright radar returns can come from rough surfaces, buildings, or flooded vegetation; smooth open water often appears dark. Wind can roughen water and make it brighter. A single image therefore does not identify a cause by itself; repeated observations and context are needed.',
    keywords: ['bright', 'dark', 'water', 'flood', 'wind', 'roughness', 'interpretation'],
  },
];

export const SITE_NOTES: Record<SiteId, SiteNotes> = {
  california: {
    why: 'California case study: wildfire scars, vegetation recovery, and subsidence in a tectonically active, drought-prone region.',
    limits: 'Smoke and burn scars can change both surface roughness and moisture, so brightness changes are not automatically damage. Short records cannot separate seasonal effects from permanent change.',
  },
  nile_delta: {
    why: 'Nile Delta case study: irrigated agriculture, soil moisture, coastal change, and land subsidence in a low-lying delta.',
    limits: 'Irrigation, crop calendars, and wind-roughened water can all change radar returns. Coherence can drop over vegetation and wet soil, so displacement estimates need careful screening.',
  },
  himalaya: {
    why: 'Himalayan case study: glacier flow, ice loss, and high-mountain hazards in steep terrain.',
    limits: 'Steep terrain causes layover and shadow; snow and ice change surface scattering; low coherence and atmospheric delay make displacement and velocity estimates uncertain.',
  },
};

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'what', 'how', 'why', 'does', 'with', 'from', 'this',
  'that', 'are', 'is', 'can', 'you', 'tell', 'about', 'please', 'explain',
  'me', 'a', 'an', 'of', 'to', 'in', 'on', 'it', 'its', 'be', 'was', 'were',
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Rank the curated chunks against a question. Returns at most `limit` chunks
 * and keeps the source order stable for citation tags.
 */
export function retrieveChunks(question: string, limit = 4): RetrievedChunk[] {
  const words = tokens(question);
  const scored = CHUNKS.map((chunk) => {
    const haystack = `${chunk.section} ${chunk.text} ${chunk.keywords.join(' ')}`.toLowerCase();
    let score = 0;
    for (const word of words) {
      if (chunk.keywords.some((keyword) => keyword.includes(word) || word.includes(keyword))) {
        score += 3;
      } else if (haystack.includes(word)) {
        score += 1;
      }
    }
    return { chunk, score };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const selected = scored.length > 0
    ? scored.map(({ chunk }) => chunk)
    : CHUNKS.filter((chunk) => chunk.sourceId === 'nisar-mission').slice(0, 2);

  const sourceTags = new Map<string, string>();
  let nextTag = 1;
  return selected.map((chunk) => {
    if (!sourceTags.has(chunk.sourceId)) {
      sourceTags.set(chunk.sourceId, `S${nextTag}`);
      nextTag += 1;
    }
    const source = SOURCES.find((item) => item.id === chunk.sourceId);
    return {
      id: chunk.id,
      citationTag: sourceTags.get(chunk.sourceId) as string,
      sourceId: chunk.sourceId,
      sourceTitle: source?.title ?? 'NISAR reference',
      sourceUrl: source?.url ?? 'https://nisar.jpl.nasa.gov/',
      attribution: source?.attribution ?? 'NASA/JPL-Caltech',
      section: chunk.section,
      page: chunk.page,
      text: chunk.text,
      score: 1,
    };
  });
}

export function sourcesForChunks(chunks: RetrievedChunk[]) {
  const seen = new Set<string>();
  return chunks
    .filter((chunk) => {
      if (seen.has(chunk.citationTag)) return false;
      seen.add(chunk.citationTag);
      return true;
    })
    .map((chunk) => ({
      id: chunk.sourceId,
      title: chunk.sourceTitle,
      url: chunk.sourceUrl,
      attribution: chunk.attribution,
      citationTag: chunk.citationTag,
      section: chunk.section,
      page: chunk.page,
      score: chunk.score,
    }));
}
