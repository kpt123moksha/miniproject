export type Role = 'citizen' | 'authority' | 'worker' | 'admin';
export type ServiceCity = 'Mangaluru' | 'Bantwal' | 'Udupi';

export interface ServiceAreaFeature extends GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  properties: { city: ServiceCity; [key: string]: unknown };
}

export interface ServiceAreaCollection extends GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  features: ServiceAreaFeature[];
}

export interface CitySummary {
  city: ServiceCity;
  total: number;
  pending: number;
  assigned: number;
  completed: number;
  overdue: number;
}

export interface User {
  user_id: number;
  name: string;
  email: string;
  role: Role;
  area_id: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Complaint {
  complaint_id: number;
  city?: ServiceCity | null;
  citizen_id: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  latitude: number;
  longitude: number;
  location_name: string;
  status: string;
  photo_path: string;
  created_at: string;
  elevation_m: number | null;
  forecast_rainfall_mm: number | null;
  risk_score: number | null;
  risk_category: string | null;
  cleaning_priority: string | null;
  deadline?: string;
  task_status?: string;
  worker_name?: string;
  before_photo?: string;
  after_photo?: string;
  completion_description?: string;
  task_id?: number;
  worker_id?: number;
  authority_confirmed?: boolean;
  citizen_confirmed?: boolean;
  citizen_rating?: number | null;
  citizen_feedback?: string | null;
}

export interface WeatherData {
  available: boolean;
  message?: string;
  current?: {
    temperatureC: number | null;
    rainfallMm: number | null;
    rainMm: number | null;
    weatherCode: number | null;
    time: string | null;
  } | null;
  forecast?: Array<{time:string; rainfallMm:number|null; probability:number|null}>;
}

export interface DashboardSummary {
  counts: {total:number;pending:number;assigned:number;completed:number;overdue:number};
  cityStats: CitySummary[];
  weather: WeatherData;
  area: {area_name:string;authority_name:string;latitude:number;longitude:number} | null;
}

export interface Worker {
  user_id: number;
  name: string;
  phone: string | null;
}
