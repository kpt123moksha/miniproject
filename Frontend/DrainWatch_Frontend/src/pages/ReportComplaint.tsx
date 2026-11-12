import {useRef,useState} from 'react';
import {LoaderCircle,MapPin,LocateFixed} from 'lucide-react';
import MapView from '../components/MapView';
import {analyzeComplaintImage,submitComplaint} from '../services/complaintService';
import {identifyServiceCity,searchServiceLocations} from '../services/serviceAreaService';
import type {ServiceCity} from '../types';

export default function ReportComplaint({onDone}:{onDone:()=>void}) {
  const [title,setTitle]=useState('');const [description,setDescription]=useState('');const [severity,setSeverity]=useState('');
  const [locationName,setLocationName]=useState('');const [coords,setCoords]=useState<[number,number]|null>(null);
  const [city,setCity]=useState<ServiceCity|null>(null);
  const [gpsFocus,setGpsFocus]=useState<[number,number]|null>(null);
  const [photo,setPhoto]=useState<File|null>(null);const [error,setError]=useState('');const [analysisError,setAnalysisError]=useState('');const [analyzing,setAnalyzing]=useState(false);const [success,setSuccess]=useState('');const [saving,setSaving]=useState(false);const [locating,setLocating]=useState(false);
  const [searchText,setSearchText]=useState('');const [searching,setSearching]=useState(false);
  const [searchError,setSearchError]=useState('');
  const [searchMessage,setSearchMessage]=useState('');
  const [searchResults,setSearchResults]=useState<Array<{display_name:string;latitude:number;longitude:number;city:ServiceCity}>>([]);
  const [selectedSearchResult,setSelectedSearchResult]=useState('');
  const coordinateRequest=useRef(0);
  const imageRequest=useRef(0);
  const suggestedLocations=city==='Bantwal'
    ?['Bantwal','B.C. Road','Farangipete','Vitla','Kalladka','Manchi']
    :city==='Udupi'
      ?['Udupi','Manipal','Malpe']
      :['Pumpwell','Padil','Adyar','Attavara Katte','Ambikanagara Katte','Kodikal Katte'];
  const selectedPlace=searchMessage.split(',').slice(0,3).join(',').trim();

  function selectSearchResult(result:{display_name:string;latitude:number;longitude:number;city:ServiceCity}){
    setSelectedSearchResult(`${result.latitude},${result.longitude}`);
    setLocationName(result.display_name);
    setSearchMessage(result.display_name);
    void updateCoordinates(result.latitude,result.longitude,true);
  }

  async function analyzePhoto(file:File|null){
    const requestId=++imageRequest.current;
    setPhoto(file);
    setSeverity('');
    setAnalysisError('');
    setAnalyzing(Boolean(file));
    if(!file)return;
    try{
      const result=await analyzeComplaintImage(file);
      if(requestId===imageRequest.current)setSeverity(result.severity.toLowerCase());
    }catch(err){
      if(requestId===imageRequest.current)setAnalysisError(err instanceof Error?err.message:'Could not analyze the image.');
    }finally{
      if(requestId===imageRequest.current)setAnalyzing(false);
    }
  }

  async function updateCoordinates(latitude:number,longitude:number,focus=false){
    const location:[number,number]=[Number(latitude),Number(longitude)];
    if(!Number.isFinite(location[0])||!Number.isFinite(location[1])){
      setError('The selected location has invalid GPS coordinates.');
      return;
    }
    setCoords(location);
    if(focus)setGpsFocus(location);
    const requestId=++coordinateRequest.current;
    setError('Checking service-area boundary…');
    try{
      const detectedCity=await identifyServiceCity(location[0],location[1]);
      if(requestId!==coordinateRequest.current)return;
      setCity(detectedCity);
      setError(detectedCity?'': 'These coordinates are outside the configured service areas.');
    }catch(err){
      if(requestId!==coordinateRequest.current)return;
      setCity(null);
      setError(err instanceof Error?err.message:'Could not check the city boundary.');
    }
  }

  function locate(){
    setError('');
    if(!navigator.geolocation){setError('Location is not supported by this browser. You can select a location on the map.');return;}
    setLocating(true);
    try {
      navigator.geolocation.getCurrentPosition(position=>{
        void updateCoordinates(position.coords.latitude,position.coords.longitude,true);
        setLocating(false);
      },positionError=>{
        const message=positionError.code===positionError.PERMISSION_DENIED
          ?'Location permission was denied. Allow location access in your browser settings, or select a point on the map.'
          :positionError.code===positionError.POSITION_UNAVAILABLE
            ?'Your current location is unavailable. Check your device location settings or select a point on the map.'
            :positionError.code===positionError.TIMEOUT
              ?'Finding your location timed out. Try again or select a point on the map.'
              :'Could not detect your location. Try again or select a point on the map.';
        setError(message);
        setLocating(false);
      },{enableHighAccuracy:true,timeout:15000,maximumAge:0});
    } catch {
      setError('Could not access location. Use a secure browser connection or select a point on the map.');
      setLocating(false);
    }
  }

  async function searchLocations(query=searchText){
    setSearchText(query);
    setSearchError('');setSearchMessage('');setSearchResults([]);setSelectedSearchResult('');
    if(!city){setSearchError('Select a service city before searching for a location.');return;}
    if(query.trim().length<3){setSearchError('Enter at least 3 characters to search.');return;}
    setSearching(true);
    try{
      const result=await searchServiceLocations(query.trim(),city);
      setSearchResults(result.results);
      if(!result.results.length){
        setSearchError(`No matching locations were found inside ${city}.`);
      }else{
        const bestMatch=result.results[0];
        selectSearchResult(bestMatch);
      }
    }catch(err){setSearchError(err instanceof Error?err.message:'Location search failed.');}
    finally{setSearching(false);}
  }

  async function submit(e:React.FormEvent){
    e.preventDefault();setError('');setSuccess('');
    if(!title.trim()){setError('Enter a complaint title.');return;}
    if(!description.trim()){setError('Enter a problem description.');return;}
    if(!['low','medium','high','critical'].includes(severity)){setError('Upload a photo and wait for its severity to be analyzed.');return;}
    if(!coords){setError('Please capture your GPS location or select a point on the map.');return;}
    if(!city){setError('Choose a service city and select coordinates inside its boundary.');return;}
    const [latitude,longitude]=coords;
    if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude < -90||latitude > 90||longitude < -180||longitude > 180){setError('Select a valid map location with latitude between -90 and 90 and longitude between -180 and 180.');return;}
    if(!photo){setError('Please attach a photograph of the drainage issue.');return;}
    setSaving(true);
    try{
      await submitComplaint({title,description,severity,latitude,longitude,locationName,city,photo});
      setSuccess('Complaint submitted successfully. It has been saved.');
      window.setTimeout(onDone,1800);
    }
    catch(err){setError(err instanceof Error?err.message:'Could not submit complaint.');}
    finally{setSaving(false);}
  }
  return <div className="page-content narrow">
    <div className="page-heading"><span className="eyebrow">CITIZEN SERVICES</span><h1>Report a drainage problem</h1><p>Describe the issue and confirm the location so the local authority can respond.</p></div>
    <form className="panel form-panel" onSubmit={submit}>
      <label>Complaint title<input required maxLength={150} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Briefly summarize the problem"/></label>
      <label>Problem description<textarea rows={4} required value={description} onChange={e=>setDescription(e.target.value)} placeholder="What is happening at this location?"/></label>
      <label>Severity<input readOnly value={severity?severity.charAt(0).toUpperCase()+severity.slice(1):analyzing?'Analyzing photo…':'Upload a photo to detect severity'} /></label>
      <label>Location or nearby landmark<input value={locationName} onChange={e=>setLocationName(e.target.value)} placeholder="Street name or landmark"/></label>
      <label>Service area<select required value={city||''} onChange={e=>{setCity((e.target.value||null) as ServiceCity|null);setSearchResults([]);setSelectedSearchResult('');setSearchError('');setSearchMessage('');}}><option value="">Select a service area</option><option value="Mangaluru">Mangaluru taluk</option><option value="Bantwal">Bantwal taluk</option><option value="Udupi">Udupi taluk</option></select></label>
      <div className="location-search">
        <label>Search for a location<input value={searchText} onChange={e=>setSearchText(e.target.value)} placeholder="Street, landmark or place"/></label>
        <button type="button" className="button secondary" onClick={()=>void searchLocations()} disabled={searching}>{searching?'Searching…':'Search'}</button>
      </div>
      <div className="location-suggestions" aria-label={`Popular ${city||'service-area'} locations`}>
        <span>Popular {city||'nearby'} places:</span>
        {suggestedLocations.map(place=><button type="button" key={place} onClick={()=>void searchLocations(place)} disabled={searching}>{place}</button>)}
      </div>
      <small className="search-attribution">Search by <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>. Results are checked against the selected taluk boundary.</small>
      {searchError&&<div className="error-message" role="alert">{searchError}</div>}
      {searchMessage&&<div className="location-selected" role="status"><MapPin size={16}/><span><b>Map pin set</b><small>{selectedPlace}</small></span></div>}
      {searchResults.length>0&&<div className="location-results" aria-label="Location search results">
        <b className="location-results-heading">{searchResults.length} places found <span>Choose one to move the map pin</span></b>
        <div className="location-results-list">
          {searchResults.map(result=>{
            const resultId=`${result.latitude},${result.longitude}`;
            const [placeName,...address]=result.display_name.split(',').map(part=>part.trim());
            return <button type="button" className={`location-result${selectedSearchResult===resultId?' selected':''}`} key={resultId} onClick={()=>selectSearchResult(result)}>
              <span className="location-result-icon"><MapPin size={15}/></span>
              <span className="location-result-text"><b>{placeName}</b><small>{address.slice(0,3).join(', ')}</small></span>
              {selectedSearchResult===resultId&&<span className="location-result-selected">Pinned</span>}
            </button>;
          })}
        </div>
      </div>}
      <div className="form-section-title"><div><b>Confirm the GPS location</b><small>Allow browser location access or click the map to adjust the marker.</small></div>
        <button type="button" className="button secondary" onClick={locate} disabled={locating}>
          {locating?<LoaderCircle className="location-spinner" size={16}/>:<LocateFixed size={16}/>}
          {locating?'Detecting location…':'Use my location'}
        </button></div>
      <MapView selected={coords} focusOn={gpsFocus} onSelect={(lat,lon)=>{void updateCoordinates(lat,lon);}}/>
      {coords&&<p className="coordinate-line"><MapPin size={14}/> Lat {coords[0].toFixed(6)}, Lng {coords[1].toFixed(6)}</p>}
      <label>Upload photograph<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>void analyzePhoto(e.target.files?.[0]||null)}/><small>Accepted: JPG, PNG or WEBP. Maximum 5 MB. Severity is estimated automatically from the photo.</small></label>
      {analyzing&&<p role="status">Analyzing the photo to estimate severity…</p>}
      {severity&&<p role="status">AI severity estimate: {severity}. Please verify the photo and description before submitting.</p>}
      {analysisError&&<div className="error-message" role="alert">{analysisError} <button type="button" className="button secondary" onClick={()=>void analyzePhoto(photo)} disabled={analyzing}>Try again</button></div>}
      {error&&<div className="error-message" role="alert">{error}</div>}
      {success&&<div className="success-message" role="status">{success}</div>}
      <button className="button primary" disabled={saving||Boolean(success)}>{saving?'Submitting report…':'Submit complaint'}</button>
    </form>
  </div>;
}
