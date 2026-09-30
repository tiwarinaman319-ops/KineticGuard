import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";
  const today = new Date().toISOString().split("T")[0];

  try {
    const nasaRes = await fetch(
      `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );

    if (!nasaRes.ok) {
      throw new Error(`NASA API returned status ${nasaRes.status}`);
    }

    const data = await nasaRes.json();
    const nearEarthObjects = data.near_earth_objects[today] || [];

    const liveThreats = nearEarthObjects.slice(0, 5).map((neo: any, index: number) => {
      const approachData = neo.close_approach_data?.[0];
      const velocityKps = approachData
        ? parseFloat(approachData.relative_velocity.kilometers_per_second).toFixed(2)
        : "11.42";
      const missDistanceKm = approachData
        ? Math.round(parseFloat(approachData.miss_distance.kilometers)).toLocaleString()
        : "450,000";

      return {
        id: neo.id,
        name: neo.name.replace("(", "").replace(")", ""),
        diameterMeters: Math.round(
          neo.estimated_diameter?.meters?.estimated_diameter_max || 45
        ),
        isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid,
        relativeVelocityKps: `${velocityKps} km/s`,
        missDistanceKm: `${missDistanceKm} km`,
        assignedThreatNode: (index * 7 + 11) % 48,
      };
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      source: "NASA Jet Propulsion Laboratory (JPL) SSD NeoWs",
      totalTrackedToday: data.element_count,
      threats: liveThreats,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        source: "NASA JPL Feed (Simulated Fallback Mode)",
        timestamp: new Date().toISOString(),
        totalTrackedToday: 14,
        threats: [
          {
            id: "2024-YR4",
            name: "Debris Cluster KG-DEB-09",
            diameterMeters: 38,
            isPotentiallyHazardous: true,
            relativeVelocityKps: "14.28 km/s",
            missDistanceKm: "32,450 km",
            assignedThreatNode: 17,
          },
          {
            id: "2026-XF1",
            name: "Fragmentation Vector Cosmos-1408",
            diameterMeters: 12,
            isPotentiallyHazardous: true,
            relativeVelocityKps: "9.84 km/s",
            missDistanceKm: "18,200 km",
            assignedThreatNode: 23,
          },
        ],
      },
      { status: 200 }
    );
  }
}