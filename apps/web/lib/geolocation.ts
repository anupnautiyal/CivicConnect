type Position = { coords: { latitude:number; longitude:number; accuracy:number } };
type Failure = { code:number };
export type LocationProvider = {
 getCurrentPosition(success:(position:Position)=>void,error:(error:Failure)=>void,options:{enableHighAccuracy:boolean;timeout:number;maximumAge:number}):void;
};
export function locationErrorMessage(code:number):string {
 if(code===1)return "Location access is blocked by the browser or operating system. Check site permissions and device Location services, or choose a point on the map.";
 if(code===3)return "The browser did not return a location. Use Search location below to find your area, then adjust the pin. Automatic location may work in Chrome or Edge with device Location services enabled.";
 return "The browser could not determine your location. Check device Location services, or try this page in Chrome or Edge. You can also choose a point on the map.";
}
export async function locateDevice(provider:LocationProvider,onFallback:()=>void):Promise<Position> {
 const request=(high:boolean)=>new Promise<Position>((resolve,reject)=>{
  provider.getCurrentPosition(resolve,reject,{enableHighAccuracy:high,timeout:high?12000:8000,maximumAge:60000});
 });
 try{return await request(false);}
 catch(error){
  if((error as Failure)?.code===1)throw error;
  onFallback();
  return request(true);
 }
}


