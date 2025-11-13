const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function listDesigns() {
  const r = await fetch(`${API}/api/designs`, { cache: 'no-store' });
  return r.json();
}
export async function createDesign(payload: { name:string; data:any; medalImages?:any }) {
  const r = await fetch(`${API}/api/designs`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(payload)
  });
  return r.json();
}
// ...getDesign, updateDesign, deleteDesign similares
