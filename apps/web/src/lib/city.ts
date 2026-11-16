// Groups venue city strings into canonical city buckets (Delhi metro → Delhi-NCR).
export function normalizeCity(city?: string | null): string {
  const c = (city || '').toLowerCase();
  if (c.includes('delhi') || c.includes('noida') || c.includes('gurugram') || c.includes('gurgaon') || c.includes('ncr')) {
    return 'Delhi-NCR';
  }
  return city || '';
}
