import assert from 'node:assert/strict';
import test from 'node:test';
import { formatAttendeeName, formatCity, careerStage, normalizedPhone, findDuplicateGroups } from '../lib/attendee-presentation.ts';

test('badge names handle lowercase, uppercase, hyphens, initials, accents and native script without respelling', () => {
  assert.equal(formatAttendeeName('  rekar   adl sabr '), 'Rekar Adl Sabr');
  assert.equal(formatAttendeeName('MUHND NURI SHKOR ALAZAWE'), 'Muhnd Nuri Shkor Alazawe');
  assert.equal(formatAttendeeName('ahmed al-jubouri'), 'Ahmed Al-Jubouri');
  assert.equal(formatAttendeeName('mohammed j. rashid'), 'Mohammed J. Rashid');
  assert.equal(formatAttendeeName('Siva Salam HamaSalih'), 'Siva Salam HamaSalih');
  assert.equal(formatAttendeeName('kallé dhahir'), 'Kallé Dhahir');
  assert.equal(formatAttendeeName('حمە شوان کریم'), 'حمە شوان کریم');
});

test('observed city variants converge while district cities remain distinct', () => {
  for (const city of ['Slemani','Sulaimanyah','Sulaymanyiah','Sulaimanyeah','Suli','سلێمانی','Sulaymaniayah','Swlaymaniyah','Sulyimaniyah','Sulaymaniyah (ISU)']) assert.equal(formatCity(city),'Sulaymaniyah',city);
  assert.equal(formatCity('Ranya- sulaimani'), 'Ranya');
  assert.equal(formatCity('Rania'), 'Ranya');
  assert.equal(formatCity('Chamchamal, sulaymaniah'), 'Chamchamal');
  assert.equal(formatCity('Halabjay Shahid'), 'Halabja');
  assert.equal(formatCity('Mosil'), 'Mosul');
  assert.equal(formatCity('kirkuk'), 'Kirkuk');
  assert.equal(formatCity('new town'), 'New Town');
});

test('career stages prioritize profession and training over specialty words', () => {
  const cases = {
    'J.H.O':'Junior house officer', 'Resident doctor (JHO)':'Junior house officer',
    'Senior house officer of internal medicine':'Senior house officer',
    'MBCHB / Junior Resident Doctor':'Resident doctor', 'JRD':'Resident doctor',
    'Internal medicine /Hematology board student':'Resident doctor',
    'Orthopedic residence':'Resident doctor', 'SHO clinical Pharmacist':'Pharmacist',
    'Assistant Pharmacist':'Other healthcare professional', 'Med student-UOS':'Medical student',
    'Student in college of medicine':'Medical student', 'Student Doctor':'Medical student',
    'Consultant/ professor internal medicine':'Consultant', 'Ass. prof Hematopathologist':'Specialist',
    'Junior Dctor':'Junior doctor', 'Neurologist':'Specialist',
    'Doctor':'Needs review', 'Internal medicine':'Needs review', 'Hematopathology':'Needs review',
    'MEDICAL GRADUATE / GENERAL PRACTITIONER':'General practitioner',
    'Medical representative':'Other profession', 'Medical Laboratory Technician':'Other healthcare professional',
  };
  for (const [position, stage] of Object.entries(cases)) assert.equal(careerStage(position),stage,position);
});
const record = (id, overrides={}) => ({id, full_name:'Example Person', email:`${id}@example.com`, phone_number:null, city:'Slemani', created_at:`2026-09-${id.padStart(2,'0')}T10:00:00Z`, is_test:false, registration_status:'registered', checked_in_at:null, badge_print_count:0, ...overrides});

test('Iraqi contact formats converge; incomplete phones and blanks never match', () => {
  for (const phone of ['07701234567','7701234567','+9647701234567','009647701234567','96407701234567','٠٧٧٠١٢٣٤٥٦٧']) assert.equal(normalizedPhone(phone),'9647701234567');
  assert.equal(normalizedPhone('773831364'),'');
  assert.equal(normalizedPhone(null),'');
  assert.equal(findDuplicateGroups([record('1',{full_name:'One'}),record('2',{full_name:'Two'})]).length,0);
});

test('duplicate groups recommend newest, explain evidence, exclude tests, and do not mutate data', () => {
  const records = [record('1',{phone_number:'07701234567'}),record('3',{phone_number:'+9647701234567'}),record('2',{full_name:'Example Persson',phone_number:'009647701234567'}),record('4',{is_test:true})];
  const before = structuredClone(records);
  const [group] = findDuplicateGroups(records);
  assert.deepEqual(group.records.map(r=>r.id),['3','2','1']);
  assert.equal(group.newest.id,'3');
  assert.equal(group.confidence,'Possible duplicate');
  assert.equal(group.matches.length,3);
  assert.deepEqual(records,before);
});

test('shared names and phones alone stay review candidates; history is flagged', () => {
  assert.equal(findDuplicateGroups([record('1'),record('2')])[0].confidence,'Possible duplicate');
  const [strong] = findDuplicateGroups([record('1',{phone_number:'07701234567'}),record('2',{phone_number:'+9647701234567',checked_in_at:'2026-09-20T00:00:00Z'})]);
  assert.equal(strong.confidence,'Likely duplicate');
  assert.equal(strong.protectedHistory,true);
  assert.equal(findDuplicateGroups([record('1',{full_name:'One'}),record('2',{full_name:'Other',email:'1@example.com'})])[0].matches[0].reasons[0],'Same email');
});

test('city chart groups standard spellings, excludes cancelled and test rows, and reconciles to active total', async () => {
  const {countAttendeesByCity}=await import('../lib/attendee-presentation.ts');
  const active=city=>({city,is_test:false,registration_status:'registered'});
  const rows=[active('Slemani'),active('Sulaymaniyah'),active('سلێمانی'),active('Hawler'),active('erbil'),active('Kirkuk'),{...active('Mosul'),is_test:true},{...active('Duhok'),registration_status:'cancelled'}];
  const before=structuredClone(rows);
  const chart=countAttendeesByCity(rows);
  assert.deepEqual(chart,[{city:'Sulaymaniyah',count:3},{city:'Erbil',count:2},{city:'Kirkuk',count:1}]);
  assert.equal(chart.reduce((sum,row)=>sum+row.count,0),6);
  assert.deepEqual(rows,before);
});

test('city chart handles empty results, unknown cities, and ties consistently', async () => {
  const {countAttendeesByCity}=await import('../lib/attendee-presentation.ts');
  assert.deepEqual(countAttendeesByCity([]),[]);
  const rows=['new town',' ','kirkuk'].map(city=>({city,is_test:false,registration_status:'registered'}));
  assert.deepEqual(countAttendeesByCity(rows),[{city:'Kirkuk',count:1},{city:'New Town',count:1},{city:'Not specified',count:1}]);
});
