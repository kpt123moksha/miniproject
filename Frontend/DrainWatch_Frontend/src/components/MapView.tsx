import { useEffect, useRef, useState } from 'react';
import { GeoJSON as GeoJSONLayer, MapContainer,TileLayer,Marker,Popup,useMap,useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Complaint, ServiceAreaCollection } from '../types';
import { getServiceAreas } from '../services/serviceAreaService';

const DEFAULT_MAP_CENTER: [number, number] = [12.9141, 74.8560];

const markerIcon=(category?:string|null)=>L.divIcon({
  className:'',
  html:`<span class="map-dot ${(category||'low').toLowerCase()}"></span>`,
  iconSize:[18,18],iconAnchor:[9,9]
});

function ClickHandler({onSelect}:{onSelect?:(lat:number,lon:number)=>void}) {
  useMapEvents({click(event){onSelect?.(event.latlng.lat,event.latlng.lng);}});
  return null;
}

function FocusLocation({coordinates}:{coordinates?:[number,number]|null}) {
  const map = useMap();
  useEffect(() => {
    if (coordinates) map.setView(coordinates, 16);
  }, [coordinates, map]);
  return null;
}

function FitServiceAreas({areas,focusOn}:{areas:ServiceAreaCollection|null;focusOn?:[number,number]|null}) {
  const map = useMap();
  const hasFit = useRef(false);
  useEffect(() => {
    if (!areas || focusOn || hasFit.current) return;
    const bounds = L.geoJSON(areas).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20], maxZoom: 12 });
    hasFit.current = true;
  }, [areas, focusOn, map]);
  return null;
}

interface Props {
  complaints?:Complaint[];
  selected?:[number,number]|null;
  focusOn?:[number,number]|null;
  onSelect?: (lat:number,lon:number)=>void;
  height?:number;
}
export default function MapView({complaints=[],selected,focusOn,onSelect,height=370}:Props) {
  const [serviceAreas,setServiceAreas]=useState<ServiceAreaCollection|null>(null);
  const [serviceAreaError,setServiceAreaError]=useState('');
  useEffect(()=>{getServiceAreas().then(setServiceAreas).catch(error=>setServiceAreaError(error instanceof Error?error.message:'City boundaries are unavailable.'));},[]);
  const center:[number,number]=selected ||
    (complaints.length?[Number(complaints[0].latitude),Number(complaints[0].longitude)]:DEFAULT_MAP_CENTER);
  const initialZoom=selected||complaints.length?13:12;
  return <div className="map-view"><MapContainer center={center} zoom={initialZoom} style={{height,width:'100%',borderRadius:12}}>
    <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
    <ClickHandler onSelect={onSelect}/>
    <FocusLocation coordinates={focusOn}/>
    <FitServiceAreas areas={serviceAreas} focusOn={focusOn}/>
    {serviceAreas?.features.map(feature=><GeoJSONLayer
      key={feature.properties.city}
      data={feature}
      style={{
        color:feature.properties.city==='Mangaluru'?'#087e6c':feature.properties.city==='Bantwal'?'#d56b24':'#7057b8',
        weight:3,
        fillOpacity:0.04
      }}
      onEachFeature={(geoFeature,layer)=>layer.bindTooltip(String(geoFeature.properties?.city||'Service area'))}
    />)}
    {complaints.map(item=><Marker key={item.complaint_id}
      position={[Number(item.latitude),Number(item.longitude)]}
      icon={markerIcon(item.risk_category)}>
      <Popup><b>Complaint #{item.complaint_id}</b><br/>{item.location_name}<br/>
        Risk: {item.risk_score??'Not available'}<br/>{item.status}</Popup>
    </Marker>)}
    {selected&&<Marker
      position={selected}
      draggable={Boolean(onSelect)}
      eventHandlers={{dragend(event){
        const location=event.target.getLatLng();
        onSelect?.(location.lat,location.lng);
      }}}
    ><Popup>Selected location</Popup></Marker>}
  </MapContainer>{serviceAreaError&&<div className="map-boundary-warning" role="status">City boundaries unavailable: {serviceAreaError}</div>}</div>;
}
