import { api } from './api';
import type { Complaint, DashboardSummary, ServiceCity, Worker } from '../types';

interface ApiComplaint {
  id: number;
  city: ServiceCity | null;
  citizen_id: number;
  description: string;
  severity: string;
  latitude: number;
  longitude: number;
  location_text: string | null;
  photo_url: string | null;
  created_at: string;
  elevation_m: number | null;
  rainfall_mm: number | null;
  risk_score: number | null;
  risk_level: string | null;
  status: string;
}

async function getComplaints(city?: ServiceCity) {
  const path = city ? `/complaints?city=${encodeURIComponent(city)}` : '/complaints';
  const result = await api<{ complaints: ApiComplaint[] }>(path);
  return result.complaints.map((item): Complaint => ({
    complaint_id: item.id,
    city: item.city,
    citizen_id: item.citizen_id,
    description: item.description,
    severity: item.severity.toLowerCase() as Complaint['severity'],
    latitude: item.latitude,
    longitude: item.longitude,
    location_name: item.location_text || '',
    status: item.status,
    photo_path: item.photo_url || '',
    created_at: item.created_at,
    elevation_m: item.elevation_m,
    forecast_rainfall_mm: item.rainfall_mm,
    risk_score: item.risk_score,
    risk_category: item.risk_level,
    cleaning_priority: null
  }));
}

export function getMyComplaints() {
  return getComplaints();
}

export function getAllComplaints(city?: ServiceCity) {
  return getComplaints(city);
}

interface ApiWeather {
  temperature: number | null;
  precipitation: number | null;
  rain: number | null;
  weatherCode: number | null;
  hourly: Array<{ time: string; precipitation: number | null }>;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [summary, weather] = await Promise.all([
    api<{
      total: number;
      pending: number;
      assigned: number;
      completed: number;
      overdue: number;
      city_stats: DashboardSummary['cityStats'];
    }>('/dashboard/summary'),
    api<ApiWeather>('/weather').catch(() => null)
  ]);
  return {
    counts: {
      total: summary.total,
      pending: summary.pending,
      assigned: summary.assigned,
      completed: summary.completed,
      overdue: summary.overdue
    },
    cityStats: summary.city_stats,
    weather: {
      available: weather !== null,
      current: weather ? {
        temperatureC: weather.temperature,
        rainfallMm: weather.precipitation,
        rainMm: weather.rain,
        weatherCode: weather.weatherCode,
        time: null
      } : null,
      forecast: weather?.hourly.map(item => ({
        time: item.time,
        rainfallMm: item.precipitation,
        probability: null
      })) || []
    },
    area: null
  };
}

export function getWorkers() {
  return api<Worker[]>('/tasks/workers');
}

export function analyzeComplaintImage(photo: File) {
  const body = new FormData();
  body.append('photo', photo);
  return api<{ severity: 'Low' | 'Medium' | 'High' | 'Critical' }>('/complaints/analyze-image', {
    method: 'POST',
    body
  });
}

export function submitComplaint(input: {
  title:string;description:string;severity:string;latitude:number;longitude:number;
  locationName:string;city:ServiceCity;photo:File
}) {
  const body = new FormData();
  body.append('title', input.title.trim());
  body.append('description', input.description.trim());
  body.append('severity', input.severity.charAt(0).toUpperCase() + input.severity.slice(1).toLowerCase());
  body.append('latitude', String(Number(input.latitude)));
  body.append('longitude', String(Number(input.longitude)));
  body.append('location_text', input.locationName.trim());
  body.append('city', input.city);
  body.append('photo', input.photo);
  return api('/complaints', {method:'POST',body});
}

export function updateComplaintStatus(id:number,status:string) {
  return api(`/complaints/${id}/status`, {method:'PATCH',body:JSON.stringify({status})});
}

export function assignWorker(id:number,workerId:number,deadline:string) {
  return api(`/tasks/${id}/assign`, {
    method:'POST',body:JSON.stringify({workerId,deadline})
  });
}

export function verifyCleaning(id:number,resolved:boolean,feedback:string) {
  return api(`/complaints/${id}/verify`, {
    method:'POST',body:JSON.stringify({resolved,feedback})
  });
}

export function updateTaskStatus(taskId:number,taskStatus:string) {
  return api(`/tasks/${taskId}/status`, {
    method:'PATCH',body:JSON.stringify({taskStatus})
  });
}

export function uploadCleaningEvidence(taskId:number,input:{
  beforePhoto?:File;afterPhoto?:File;completionDescription:string
}) {
  const body = new FormData();
  if (input.beforePhoto) body.append('beforePhoto',input.beforePhoto);
  if (input.afterPhoto) body.append('afterPhoto',input.afterPhoto);
  body.append('completionDescription',input.completionDescription);
  return api(`/tasks/${taskId}/evidence`,{method:'POST',body});
}
