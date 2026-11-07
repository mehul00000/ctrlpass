// TMDB API response types (subset used by CtrlPass)

export type MediaType = "movie" | "tv";

export interface RawMediaResult {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  original_language?: string;
  popularity?: number;
  adult?: boolean;
}

export interface MediaItem {
  id: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  voteCount: number;
  releaseDate: string | null;
  genreIds: number[];
  originalLanguage: string;
}

export interface Paginated<T> {
  page: number;
  results: T[];
  totalPages: number;
  totalResults: number;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  publishedAt: string;
}

export interface SeasonSummary {
  id: number;
  name: string;
  seasonNumber: number;
  episodeCount: number;
  posterPath: string | null;
  airDate: string | null;
  overview: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episodeNumber: number;
  seasonNumber: number;
  stillPath: string | null;
  airDate: string | null;
  runtime: number | null;
  voteAverage: number;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logoPath: string | null;
}

export interface Genre {
  id: number;
  name: string;
}

export interface MovieDetails {
  id: number;
  mediaType: "movie";
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  logoPath: string | null;
  voteAverage: number;
  voteCount: number;
  releaseDate: string | null;
  runtime: number | null;
  status: string;
  tagline: string | null;
  genres: Genre[];
  originalLanguage: string;
  budget: number;
  revenue: number;
  productionCompanies: ProductionCompany[];
  cast: CastMember[];
  crew: CrewMember[];
  videos: Video[];
  similar: MediaItem[];
  recommendations: MediaItem[];
}

export interface TVDetails {
  id: number;
  mediaType: "tv";
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  logoPath: string | null;
  voteAverage: number;
  voteCount: number;
  releaseDate: string | null;
  lastAirDate: string | null;
  runtime: number | null;
  episodeRunTime: number[];
  status: string;
  tagline: string | null;
  genres: Genre[];
  originalLanguage: string;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  seasons: SeasonSummary[];
  networks: ProductionCompany[];
  productionCompanies: ProductionCompany[];
  cast: CastMember[];
  crew: CrewMember[];
  videos: Video[];
  similar: MediaItem[];
  recommendations: MediaItem[];
}

export interface SearchResult extends Omit<MediaItem, "mediaType"> {
  mediaType: MediaType | "person";
  name?: string; // person
  profilePath?: string | null; // person
  knownFor?: string;
}
