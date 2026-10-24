import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, type DiscoveryPreview } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";

const CATEGORIES = [
  "restaurant", "cafe", "hotel", "riad", "gym", "fitness_center",
  "hair_salon", "barbershop", "dentist", "medical_clinic",
  "retail", "car_rental", "real_estate", "travel_agency", "training_center",
];

export function DiscoveryPage() {
  const [country, setCountry] = useState("Morocco");
  const [city, setCity] = useState("Al Hoceima");
  const [categories, setCategories] = useState<string[]>(["restaurant"]);
  const [maxResults, setMaxResults] = useState(25);
  const [radius, setRadius] = useState(5000);
  const [preview, setPreview] = useState<DiscoveryPreview | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  const search = useMutation({
    mutationFn: () => api.discoveryPreview({ country, city, categories, maxResults, radiusMeters: radius }),
    onSuccess: (p) => {
      setPreview(p);
      setSelected(new Set(p.results.map((r) => r.sourceId)));
      setNotice(null);
    },
    onError: (e: Error) => setNotice(`Search failed: ${e.message}`),
  });

  const doImport = useMutation({
    mutationFn: () => api.discoveryImport(preview!.searchId, Array.from(selected)),
    onSuccess: (r) => setNotice(`Imported ${r.imported} businesses. Skipped ${r.skipped} duplicates.`),
    onError: (e: Error) => setNotice(`Import failed: ${e.message}`),
  });

  const toggleCat = (c: string) => {
    setCategories((cur) => cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Discover Businesses</h1>
      <div className="text-xs text-gray-500">
        Source: OpenStreetMap via Overpass API. Results reflect what is publicly mapped; missing data means <em>not found</em>, not <em>nonexistent</em>.
      </div>

      <Card>
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Country</label>
            <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-bg-muted border border-border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-bg-muted border border-border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Radius (m)</label>
            <input type="number" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full bg-bg-muted border border-border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Max results</label>
            <input type="number" value={maxResults} onChange={(e) => setMaxResults(Number(e.target.value))} className="w-full bg-bg-muted border border-border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xs text-gray-400 mb-1">Categories</div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => toggleCat(c)}
                className={`text-xs px-2 py-1 rounded border ${
                  categories.includes(c) ? "bg-accent border-accent text-white" : "border-border text-gray-400"
                }`}
              >{c}</button>
            ))}
          </div>
        </div>
        <button
          onClick={() => search.mutate()}
          disabled={search.isPending || categories.length === 0 || !city}
          className="mt-4 px-3 py-1.5 bg-accent hover:bg-accent-soft rounded text-sm disabled:opacity-50"
        >
          {search.isPending ? "Searching…" : "Search"}
        </button>
        {notice && <div className="text-xs mt-2 text-amber-400">{notice}</div>}
      </Card>

      {preview && (
        <Card title={`Preview (${preview.totalFound} results, ${preview.alreadyStored} already stored)`}>
          {preview.warnings.map((w, i) => <div key={i} className="text-xs text-amber-400 mb-2">{w}</div>)}
          {preview.results.length === 0 ? (
            <EmptyState title="No results" description="Try different categories or a wider radius." />
          ) : (
            <>
              <div className="max-h-96 overflow-auto border border-border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-bg-muted text-xs text-gray-400">
                    <tr>
                      <th className="p-2 text-left">
                        <input
                          type="checkbox"
                          checked={selected.size === preview.results.length}
                          onChange={(e) => setSelected(e.target.checked ? new Set(preview.results.map((r) => r.sourceId)) : new Set())}
                        />
                      </th>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Category</th>
                      <th className="p-2 text-left">City</th>
                      <th className="p-2 text-left">Website</th>
                      <th className="p-2 text-left">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.results.map((r) => (
                      <tr key={r.sourceId} className="border-t border-border/60">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selected.has(r.sourceId)}
                            onChange={(e) => {
                              setSelected((cur) => {
                                const next = new Set(cur);
                                if (e.target.checked) next.add(r.sourceId); else next.delete(r.sourceId);
                                return next;
                              });
                            }}
                          />
                        </td>
                        <td className="p-2">{r.name}</td>
                        <td className="p-2 text-gray-400">{r.category ?? "—"}</td>
                        <td className="p-2 text-gray-400">{r.city ?? "—"}</td>
                        <td className="p-2 text-gray-400 truncate max-w-[180px]">{r.websiteUrl ?? "—"}</td>
                        <td className="p-2 text-gray-400">{r.phone ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => doImport.mutate()}
                disabled={doImport.isPending || selected.size === 0}
                className="mt-3 px-3 py-1.5 bg-accent hover:bg-accent-soft rounded text-sm disabled:opacity-50"
              >
                {doImport.isPending ? "Importing…" : `Import ${selected.size} businesses`}
              </button>
            </>
          )}
        </Card>
      )}
    </div>
  );
}