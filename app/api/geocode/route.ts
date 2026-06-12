import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Nominatim search proxy — keeps a proper User-Agent per their usage policy. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "RideCost/0.1 (motorcycle trip planner; demo app)" },
    });
    if (!res.ok) return NextResponse.json({ error: `Nominatim ${res.status}` }, { status: 502 });
    const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
    return NextResponse.json({
      results: data.map((d) => ({
        name: d.display_name,
        lat: Number(d.lat),
        lon: Number(d.lon),
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
