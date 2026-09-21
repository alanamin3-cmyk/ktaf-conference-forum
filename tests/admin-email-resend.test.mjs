import assert from 'node:assert/strict';
import test from 'node:test';
import {createResendHandler} from '../supabase/functions/resend-registration/handler.mjs';
const id='11111111-1111-4111-8111-111111111111';
const row={id,full_name:'Example Doctor',position:'Resident',city:'Erbil',phone_number:null,email:'doctor@example.com',registration_code:'KTAF-2026-123456',registration_status:'registered',email_status:'sent',email_sent_at:'2026-09-01T10:00:00Z',email_resend_requested_at:null};
function setup(options={}) {
  let current=options.missing?null:{...row,...options.row};
  const writes=[],sends=[];
  const client={auth:{getUser:async token=>({data:{user:token==='valid'?{id:'admin'}:null}})},from(table){
    let patch,filters=[];
    const query={select(){return query;},eq(key,value){filters.push([key,value]);return query;},is(key,value){filters.push([key,value]);return query;},update(value){patch=value;return query;},
      async maybeSingle(){
        if(table==='admin_users')return {data:options.unapproved?null:{user_id:'admin'}};
        if(!patch)return {data:current?{...current}:null};
        if(options.claimConflict && patch.email_resend_requested_at)return {data:null};
        if(options.saveFailure && patch.email_status)return {data:null,error:{message:'database failure'}};
        if(!current||filters.some(([key,value])=>current[key]!==value))return {data:null};
        writes.push(patch);current={...current,...patch};return {data:{id}};
      },then(resolve,reject){return query.maybeSingle().then(resolve,reject);}
    };return query;
  }};
  const handler=createResendHandler({client,origins:['https://ktaf.krd'],now:()=>new Date('2026-09-21T12:00:00Z'),sendConfirmation:async(...args)=>{sends.push(args);if(options.sendFailure)throw new Error('secret provider detail');return 'provider-id';}});
  const call=async(body={registrationId:id},token='valid',origin='https://ktaf.krd',method='POST')=>{
    const response=await handler(new Request('https://example.com/resend',{method,headers:{origin,...(token?{authorization:`Bearer ${token}`}:{})},...(method==='POST'?{body:JSON.stringify(body)}:{})}));
    return {status:response.status,body:response.status===204?null:await response.json(),headers:response.headers};
  };
  return {call,writes,sends,getRow:()=>current};
}
test('rejects missing/invalid authentication and non-admin users without reading or sending attendee email',async()=>{
  for(const token of ['', 'invalid']){const s=setup();assert.equal((await s.call(undefined,token)).status,401);assert.equal(s.sends.length,0);assert.equal(s.writes.length,0);}
  const s=setup({unapproved:true});assert.equal((await s.call()).status,403);assert.equal(s.writes.length,0);
});
test('resends to stored email with original code; ignores recipient and code supplied by caller',async()=>{
  const s=setup();const result=await s.call({registrationId:id,email:'attacker@example.com',registrationCode:'NEW'});
  assert.equal(result.status,200);assert.equal(result.body.emailSent,true);assert.equal(result.body.statusSaved,true);
  assert.equal(s.sends[0][0].email,row.email);assert.equal(s.sends[0][0].registrationCode,row.registration_code);
  assert.match(s.sends[0][1],/^ktaf-admin-resend\/11111111/);
  assert.deepEqual(Object.keys(s.writes[0]),['email_resend_requested_at']);
  assert.equal(s.getRow().registration_code,row.registration_code);assert.equal(s.getRow().email_provider_id,'provider-id');
});
test('prevents simultaneous sends and enforces cooldown across independent requests',async()=>{
  const s=setup();const results=await Promise.all([s.call(),s.call()]);
  assert.equal(results.filter(r=>r.body.emailSent).length,1);assert.equal(s.sends.length,1);
  assert.equal((await s.call()).status,429);assert.equal(s.sends.length,1);
});
test('changed/cancelled/deleted records never send a confirmation',async()=>{
  for(const [opts,status] of [[{claimConflict:true},409],[{row:{registration_status:'cancelled'}},409],[{missing:true},404]]){
    const s=setup(opts);assert.equal((await s.call()).status,status);assert.equal(s.sends.length,0);
  }
});
test('provider failure preserves prior successful status and reports uncertainty safely',async()=>{
  const s=setup({sendFailure:true});const r=await s.call();assert.equal(r.status,502);
  assert.equal(s.getRow().email_status,'sent');assert.equal(s.getRow().email_sent_at,row.email_sent_at);
  assert.doesNotMatch(r.body.message,/secret/);assert.equal((await s.call()).status,429);
});
test('successful send with failed status save remains reported as sent',async()=>{
  const s=setup({saveFailure:true});const r=await s.call();assert.equal(r.status,200);assert.equal(r.body.emailSent,true);assert.equal(r.body.statusSaved,false);assert.match(r.body.message,/do not resend/);
});
test('validates method, origin, registration ID, and supports authenticated SDK preflight',async()=>{
  const s=setup();assert.equal((await s.call({registrationId:'invalid'})).status,400);
  assert.equal((await s.call(undefined,'valid','https://other.example')).status,403);
  assert.equal((await s.call(undefined,'valid',undefined,'GET')).status,405);
  const r=await s.call(undefined,'',undefined,'OPTIONS');assert.equal(r.status,204);assert.match(r.headers.get('Access-Control-Allow-Headers'),/x-client-info/);assert.equal(s.sends.length,0);
});
test('allows a deliberate later resend after the two-minute pause',async()=>{
  const s=setup({row:{email_resend_requested_at:'2026-09-21T11:57:59Z'}});assert.equal((await s.call()).status,200);assert.equal(s.sends.length,1);
});
test('readiness check verifies admin access without sending or changing registrations',async()=>{
 const s=setup();const r=await s.call({action:'check'});assert.equal(r.status,200);assert.equal(r.body.ready,true);assert.equal(s.sends.length,0);assert.equal(s.writes.length,0);
 assert.equal((await setup({unapproved:true}).call({action:'check'})).status,403);
});
