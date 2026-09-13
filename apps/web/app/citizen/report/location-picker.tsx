"use client";
import { useEffect, useRef, useState } from "react";
import type { Map, CircleMarker } from "leaflet";
import { locateDevice, locationErrorMessage } from "../../../lib/geolocation";
import { searchLocation, type Place } from "./search-location";
type Point = { lat:string; lng:string; accuracy:string };
export function LocationPicker({ point, onChange }: { point:Point; onChange:(point:Point)=>void }) {
 const container = useRef<HTMLDivElement>(null);
 const map = useRef<Map | null>(null);
 const marker = useRef<CircleMarker | null>(null);
 const requestId = useRef(0);
 const change = useRef(onChange);
 change.current = selected => { requestId.current++; setLocating(false); onChange(selected); };
 const [message,setMessage] = useState("Tap the map to select the issue location, or enter coordinates below.");
 const [locating,setLocating] = useState(false);
 const [ready,setReady] = useState(false);
 const [mapError,setMapError] = useState("");
 const [query,setQuery]=useState("");
 const [places,setPlaces]=useState<Place[]>([]);
 const [searching,setSearching]=useState(false);
 const [searchMessage,setSearchMessage]=useState("");
 useEffect(() => {
  let disposed = false;
  import("leaflet").then(L => {
   if (disposed || !container.current) return;
   const view = L.map(container.current).setView([20,78],4);
   map.current = view;
   L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
    maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
   }).on("tileerror",()=>setMapError("Map tiles could not load. You can still enter latitude and longitude below.")).addTo(view);
   view.on("click",event=>change.current({lat:event.latlng.lat.toFixed(6),lng:event.latlng.wrap().lng.toFixed(6),accuracy:""}));
   setReady(true);
  }).catch(()=>setMapError("The map is unavailable. Enter coordinates below."));
  return ()=> { requestId.current++; disposed=true; map.current?.remove(); map.current=null; marker.current=null; };
 },[]);
 useEffect(()=>{
  if (!ready || !map.current || !point.lat || !point.lng) return;
  const lat=Number(point.lat),lng=Number(point.lng);
  if (!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180) return;
  let disposed=false;
  import("leaflet").then(L=>{
   if (disposed || !map.current) return;
   if (marker.current) marker.current.setLatLng([lat,lng]);
   else marker.current=L.circleMarker([lat,lng],{radius:9,color:"#006b61",fillOpacity:0.85}).addTo(map.current);
   map.current.setView([lat,lng],Math.max(map.current.getZoom(),15));
  });
  return ()=>{disposed=true;};
 },[point.lat,point.lng,ready]);
 async function locate() {
  if (!window.isSecureContext) { setMessage("Location requires HTTPS or localhost. You can still select a point on the map."); return; }
  if (!navigator.geolocation) { setMessage("This browser does not offer device location. Try Chrome or Edge, or select a map point."); return; }
  const current = ++requestId.current;
  setLocating(true);
  setMessage("Finding your location. This can take up to 20 seconds after permission is granted.");
  try {
   const position = await locateDevice(navigator.geolocation, () => {
    if(current===requestId.current)setMessage("A quick location was unavailable. Trying a precise fix…");
   });
   if(current!==requestId.current)return;
   const {latitude,longitude,accuracy}=position.coords;
   if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180) {
    setMessage("The device returned an invalid location. Select a point on the map."); return;
   }
   onChange({lat:latitude.toFixed(6),lng:longitude.toFixed(6),accuracy:Number.isFinite(accuracy)&&accuracy>=0&&accuracy<100000?String(accuracy):""});
   setMessage(accuracy>100?"Approximate location found. Check and adjust the map pin before submitting.":"Location found. Check that the pin marks the issue.");
  } catch(error) {
   if(current===requestId.current)setMessage(locationErrorMessage((error as {code?:number})?.code??2));
  } finally { if(current===requestId.current)setLocating(false); }
 }
 async function search() {
  setSearching(true);setPlaces([]);setSearchMessage("");
  try {const result=await searchLocation(query);setPlaces(result.places||[]);setSearchMessage(result.error||(result.places?.length?"Select a result, then adjust the pin to the exact issue.":"No places found. Try a nearby town or landmark."));}
  catch {setSearchMessage("Search could not complete. Please try again.");}
  finally{setSearching(false);}
 }
 return <fieldset><legend>Issue location</legend><button type="button" className="secondary" onClick={locate} disabled={locating}>{locating?"Finding location…":"Use my location"}</button>
 <p className="hint" role="status">{message}</p> <div className="location-search"><label>Find a town, street or landmark<input value={query} maxLength={180} placeholder="For example: Clock Tower, Dehradun" onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();if(!searching&&query.trim().length>=3)void search();}}}/></label><button type="button" className="secondary" disabled={searching||query.trim().length<3} onClick={search}>{searching?"Searching…":"Search location"}</button>
 <p className="hint">Works without GPS. Search text is sent to Photon; map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>.</p>
 {searchMessage&&<p role="status">{searchMessage}</p>}<ul className="place-results">{places.map((place,i)=><li key={i}><button type="button" className="secondary" onClick={()=>{change.current({lat:place.lat,lng:place.lng,accuracy:""});setPlaces([]);setSearchMessage("Location selected. Adjust the map pin to the issue.");setMessage("Map location selected. Confirm the point before submitting.");}}>{place.label}</button></li>)}</ul></div>{mapError&&<p className="hint" role="status">{mapError}</p>}<div ref={container} className="report-map" aria-label="Select issue location on map"/>
 <div className="coordinate-fields"><label>Latitude<input name="lat" type="number" step="any" min="-90" max="90" required value={point.lat} onChange={e=>change.current({...point,lat:e.target.value,accuracy:""})}/></label>
 <label>Longitude<input name="lng" type="number" step="any" min="-180" max="180" required value={point.lng} onChange={e=>change.current({...point,lng:e.target.value,accuracy:""})}/></label></div>
 <input type="hidden" name="accuracy" value={point.accuracy}/>{point.accuracy&&<p className="hint">Location accuracy: approximately {Math.round(Number(point.accuracy))} metres.</p>}</fieldset>;
}


