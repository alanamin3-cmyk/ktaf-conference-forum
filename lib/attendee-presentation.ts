/** Admin-only presentation. Original submissions remain available for audit/export. */
export function formatAttendeeName(value: string): string {
  return value.trim().replace(/\s+/gu, " ").replace(/\p{L}[\p{L}\p{M}]*/gu, (word) => {
    const normalized = word === word.toUpperCase() ? word.toLowerCase() : word;
    return normalized[0].toUpperCase() + normalized.slice(1);
  });
}

function cityKey(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/[\s.,()_–—-]+/gu, "");
}

const cityAliases: Record<string, string> = {};
const cityGroups: Record<string, string[]> = {
  Sulaymaniyah: ["Sulaymaniyah", "Slemani", "Slemany", "Sulaimani", "Sulaymani", "Sulaimanyah", "Sulaymanyiah", "Sulaimaniya", "Suleymaniyah", "Sulaymanyha", "Sulaimanya", "Sulaimaniyah", "Sulaymaniah", "Sulaimany", "Sulaimanyeah", "Sulaimaniah", "Suleimany", "Suli", "Sulamaniah", "Sulaimania", "Sulaymaniyah (ISU)", "Sulaymaniayah", "Swlaymaniyah", "Sulyimaniyah", "Sulaimaniyyah", "Sulaymaniya", "Sulaimanyia", "سلێمانی", "السليمانية", "سليمانية"],
  Erbil: ["Erbil", "Arbil", "Hawler", "Hewler", "Hewlêr", "هەولێر", "أربيل", "اربيل"],
  Duhok: ["Duhok", "Dohuk", "Dhok", "دهۆک", "دهوك"],
  Kirkuk: ["Kirkuk", "Kerkuk", "Karkuk", "کەرکووک", "كركوك"],
  Halabja: ["Halabja", "Halabjah", "Halabjay Shahid", "Halabja Shahid", "هەڵەبجە", "حلبجة"],
  Ranya: ["Ranya", "Rania", "Ranye", "Ranya- sulaimani", "ڕانیە"],
  Chamchamal: ["Chamchamal", "Chemchemal", "Chamchamal, sulaymaniah", "چەمچەماڵ"],
  "Said Sadiq": ["Said Sadiq", "Saidsadiq", "Said Sadeq", "Sayid Sadiq", "سەیدسادق"],
  Mosul: ["Mosul", "Mosil", "Mousil", "Mousul", "موصل", "الموصل"],
  Akre: ["Akre", "Aqra", "Aqrah", "ئاکرێ"],
  Zakho: ["Zakho", "Zaxo", "زاخۆ"],
  Kalar: ["Kalar", "Kelar", "کەلار"],
  Mergasor: ["Mergasor", "Mergasur", "Mergesor"],
  Baghdad: ["Baghdad", "Bagdad", "بغداد"],
};
for (const [canonical, aliases] of Object.entries(cityGroups)) {
  for (const alias of aliases) cityAliases[cityKey(alias)] = canonical;
}
export function formatCity(value: string): string {
  return cityAliases[cityKey(value)] || formatAttendeeName(value);
}

/** Full active-registration breakdown, using the same city spellings as the table. */
export function countAttendeesByCity(registrations: readonly {
  city: string; is_test: boolean; registration_status: string;
}[]): { city: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const registration of registrations) {
    if (registration.is_test || registration.registration_status !== "registered") continue;
    const city = formatCity(registration.city) || "Not specified";
    counts.set(city, (counts.get(city) || 0) + 1);
  }
  return Array.from(counts, ([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, "en"));
}

export const CAREER_STAGES = [
  "Medical student", "Junior house officer", "Senior house officer", "Junior doctor",
  "Resident doctor", "General practitioner", "Specialist", "Consultant", "Senior doctor",
  "Pharmacist", "Other healthcare professional", "Other profession", "Needs review",
] as const;
export type CareerStage = typeof CAREER_STAGES[number];

/** This is a suggested tag from the supplied position, never a credential verification. */
export function careerStage(position: string): CareerStage {
  const text = position.toLowerCase().replace(/\bj\s*\.\s*h\s*\.\s*o\b\.?/g, "jho")
    .replace(/\bs\s*\.\s*h\s*\.\s*o\b\.?/g, "sho").replace(/\s+/g, " ");
  // Profession takes priority: SHO clinical pharmacy must not count as a doctor.
  if (/\b(pharmacist|pharmacy)\b/.test(text)) {
    return /\b(assistant|student)\b/.test(text) ? "Other healthcare professional" : "Pharmacist";
  }
  if (/\b(nurse|nursing|physiotherapist|technician|anesthesia assistant)\b/.test(text)) return "Other healthcare professional";
  if (/\b(medical representative|manager|sales)\b/.test(text)) return "Other profession";
  if (/\b(jho|junior house (officer|doctor))\b/.test(text)) return "Junior house officer";
  if (/\b(sho|senior house (officer|doctor))\b/.test(text)) return "Senior house officer";
  if (/\b(resident|residency|residence|registrar|jrd|board student|board trainee|fellow)\b/.test(text)) return "Resident doctor";
  if (/\bstudent\b/.test(text) && /\b(medical|med|medicine|doctor)\b/.test(text)) return "Medical student";
  if (/\bstudent\b/.test(text)) return "Needs review";
  if (/\bconsultant\b/.test(text)) return "Consultant";
  if (/\b(specialist|internist|interniat|cardiologist|neurologist|hematopathologist|haematopathologist|hematologist|haematologist|surgeon|orthopedician|orthopaedician|anesthesiologist|anaesthesiologist|anesthiologist|pediatrician|paediatrician|pediatresion)\b/.test(text)) return "Specialist";
  if (/\bjunior (doctor|dctor)\b/.test(text)) return "Junior doctor";
  if (/\bsenior (doctor|physician)\b/.test(text)) return "Senior doctor";
  if (/\b(gp|general practitioner|general physician|general doctor|genral practicioner)\b/.test(text)) return "General practitioner";
  // A department, degree, or the word Doctor alone does not establish seniority.
  return "Needs review";
}

export type DuplicateRegistration = {
  id: string; full_name: string; email: string; phone_number: string | null;
  city: string; created_at: string; is_test: boolean;
  registration_status: string; checked_in_at: string | null; badge_print_count: number;
};
export function normalizedPhone(value: string | null): string {
  let digits = (value || "").replace(/[٠-٩۰-۹]/g, c => String(c.charCodeAt(0) >= 1776 ? c.charCodeAt(0) - 1776 : c.charCodeAt(0) - 1632)).replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("964")) digits = digits.slice(3);
  if (/^0?7\d{9}$/.test(digits)) return "964" + digits.replace(/^0/, "");
  // Do not match incomplete numbers or placeholders.
  if (/^[1-9]\d{9,14}$/.test(digits) && !/^(\d)\1+$/.test(digits)) return digits;
  return "";
}
function nameKey(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/\b(dr|doctor|prof|professor)\.?\s+/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
export function duplicateReasons(a: DuplicateRegistration, b: DuplicateRegistration): string[] {
  const reasons: string[] = [];
  if (a.email.trim() && a.email.trim().toLowerCase() === b.email.trim().toLowerCase()) reasons.push("Same email");
  const phone = normalizedPhone(a.phone_number);
  if (phone && phone === normalizedPhone(b.phone_number)) reasons.push("Same phone");
  const name = nameKey(a.full_name);
  if (name.split(" ").length >= 2 && name === nameKey(b.full_name)) reasons.push("Same name");
  return reasons;
}
export function findDuplicateGroups<T extends DuplicateRegistration>(registrations: T[]) {
  const candidates = registrations.filter(r => !r.is_test);
  const parents = candidates.map((_, i) => i);
  const root = (i: number): number => parents[i] === i ? i : (parents[i] = root(parents[i]));
  const edges: {a: T; b: T; reasons: string[]}[] = [];
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const reasons = duplicateReasons(candidates[i], candidates[j]);
      if (reasons.length) {
        parents[root(j)] = root(i);
        edges.push({a: candidates[i], b: candidates[j], reasons});
      }
    }
  }
  const groups = new Map<number, T[]>();
  candidates.forEach((r, i) => groups.set(root(i), [...(groups.get(root(i)) || []), r]));
  return [...groups.values()].filter(records => records.length > 1).map(records => {
    records.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || a.id.localeCompare(b.id));
    const ids = new Set(records.map(r => r.id));
    const matches = edges.filter(edge => ids.has(edge.a.id) && ids.has(edge.b.id));
    const newest = records[0];
    const strong = records.slice(1).every(r => {
      const reasons = duplicateReasons(newest, r);
      return reasons.includes("Same email") || (reasons.includes("Same phone") && reasons.includes("Same name"));
    });
    const protectedHistory = records.some(r => r.checked_in_at || r.badge_print_count > 0 || r.registration_status !== "registered");
    return {records, newest, matches, confidence: strong ? "Likely duplicate" : "Possible duplicate", protectedHistory};
  }).sort((a, b) => Date.parse(b.newest.created_at) - Date.parse(a.newest.created_at));
}
