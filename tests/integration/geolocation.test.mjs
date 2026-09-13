import {test} from "node:test";
import assert from "node:assert/strict";
import {locateDevice,locationErrorMessage} from "../../apps/web/lib/geolocation.ts";
const position={coords:{latitude:30.3,longitude:78.1,accuracy:150}};
test("location success returns coordinates without another request",async()=>{
 let calls=0;const result=await locateDevice({getCurrentPosition(ok){calls++;ok(position);}},()=>assert.fail());
 assert.deepEqual(result,position);assert.equal(calls,1);
});
test("timeout and unavailable fixes retry with high accuracy",async()=>{
 for(const code of [2,3]){
 const options=[];let fallback=0;
 const result=await locateDevice({getCurrentPosition(ok,fail,settings){options.push(settings);if(options.length===1)fail({code});else ok(position);}},()=>fallback++);
 assert.deepEqual(result,position);assert.equal(fallback,1);
 assert.deepEqual(options.map(o=>o.enableHighAccuracy),[false,true]);assert.equal(options[1].maximumAge,60000);
 }
});
test("permission denial is reported without repeated requests",async()=>{
 let calls=0;
 await assert.rejects(locateDevice({getCurrentPosition(ok,fail){calls++;fail({code:1});}},()=>assert.fail()),e=>e.code===1);
 assert.equal(calls,1);assert.match(locationErrorMessage(1),/blocked/);
});
test("fallback failure retains its specific reason",async()=>{
 await assert.rejects(locateDevice({getCurrentPosition(ok,fail){fail({code:3});}},()=>{}),e=>e.code===3);
 assert.match(locationErrorMessage(3),/did not return/);assert.match(locationErrorMessage(2),/could not determine/);
});


