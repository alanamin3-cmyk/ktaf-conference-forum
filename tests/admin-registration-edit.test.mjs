import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {validateAttendeeEdit,attendeeEditError} from '../lib/admin-registration-edit.ts';
const valid={full_name:'Example Person',position:'Resident doctor',city:'Kirkuk',phone_number:'+9647701234567',email:'example@example.com'};

test('edit validation returns only the five submitted fields and preserves spelling',()=>{
  const result=validateAttendeeEdit({...valid,full_name:'  Example   Person ',email:' EXAMPLE@EXAMPLE.COM ',is_test:true,registration_status:'cancelled',registration_code:'OTHER'});
  assert.equal(result.ok,true);
  assert.deepEqual(result.value,valid);
});

test('missing legacy phone remains empty instead of preventing another correction',()=>{
  assert.equal(validateAttendeeEdit({...valid,phone_number:''}).value.phone_number,null);
});

test('rejects invalid edits before attempting a save',()=>{
  for(const change of [{full_name:''},{position:'x'},{city:'x'.repeat(101)},{email:'invalid'},{phone_number:'wrong number'},{phone_number:'123'}]){
    assert.equal(validateAttendeeEdit({...valid,...change}).ok,false,JSON.stringify(change));
  }
});

test('duplicate email and failed permissions return actionable errors',()=>{
  assert.match(attendeeEditError({code:'23505'}),/already used by another registration/);
  assert.match(attendeeEditError({code:'42501'}),/could not save/);
  assert.match(attendeeEditError({code:'OTHER'}),/Refresh/);
});

const portal=await readFile(new URL('../app/admin/AdminPortal.tsx',import.meta.url),'utf8');
const migration=await readFile(new URL('../supabase/migrations/20260921103000_allow_admin_attendee_edits.sql',import.meta.url),'utf8');
test('editor protects concurrent changes and applies returned saved values to badges',()=>{
  assert.match(portal,/request\.is\(field, null\) : request\.eq\(field, previous\)/);
  assert.match(portal,/changed or was removed while you were editing/);
  assert.match(portal,/setBadgeRegistration\(current => current\?\.id === updated\.id \? updated : current\)/);
});
test('permission change is limited to five profile columns and does not change rows or policies',()=>{
  assert.match(migration,/grant update \(full_name, position, city, phone_number, email\)/);
  assert.doesNotMatch(migration,/grant\s+(all|insert|delete)|to anon|disable row level|create policy|update public\.registrations/i);
});
