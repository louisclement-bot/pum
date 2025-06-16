import { NextResponse } from "next/server"
import { fetchRoofDetailsByRnbId } from "@/lib/roofDetailsService"

export async function GET(request: Request) {
  // Récupérer le rnb_id depuis les paramètres de requête
  const { searchParams } = new URL(request.url)
  const rnbId = searchParams.get("rnbId")

  if (!rnbId) {
    return NextResponse.json({ error: "Le paramètre rnbId est requis" }, { status: 400 })
  }

  try {
    const roofDetails = await fetchRoofDetailsByRnbId(rnbId)

    if (!roofDetails) {
      return NextResponse.json({ error: "Aucun détail de toit trouvé pour ce rnb_id" }, { status: 404 })
    }

    return NextResponse.json(roofDetails)
  } catch (error) {
    console.error("Erreur lors de la récupération des détails du toit:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des détails du toit" }, { status: 500 })
  }
}
