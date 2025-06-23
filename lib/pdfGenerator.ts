import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { SimulatorData } from "@/components/rainwater-simulator"
import type { Product } from "@/lib/productService"

/**
 * Loads the PUM logo SVG and converts it to base64 for PDF embedding
 * Uses a cached promise to avoid multiple fetches
 */
let logoPromise: Promise<string> | null = null

async function loadPumLogo(): Promise<string> {
  if (!logoPromise) {
    logoPromise = new Promise(async (resolve) => {
      try {
        // Fetch the SVG file
        const response = await fetch("/images/pum-logo.svg")
        if (!response.ok) {
          throw new Error(`Failed to load PUM logo: ${response.status}`)
        }
        
        // Get SVG content as text
        const svgText = await response.text()
        
        // Convert to base64
        const base64Logo = `data:image/svg+xml;base64,${btoa(svgText)}`
        resolve(base64Logo)
      } catch (error) {
        console.error("Error loading PUM logo:", error)
        // Return a fallback simple logo or empty string
        resolve("")
      }
    })
  }
  
  return logoPromise
}

/**
 * Generates a PDF document with simulation results and product recommendations
 * 
 * @param data Simulation data with user inputs and calculated results
 * @param recommendedTanks Array of recommended tank products
 * @param recommendedPumps Array of recommended pump products
 * @returns The generated PDF document
 */
export async function generateSimulationPDF(
  data: SimulatorData,
  recommendedTanks: Product[],
  recommendedPumps: Product[]
): Promise<jsPDF> {
  // Create new PDF document
  const doc = new jsPDF()
  
  /* -----------------------------------------------------------
   * 1️⃣  HEADER : PUM logo and title
   * --------------------------------------------------------- */
  try {
    // Load PUM logo dynamically
    const logoBase64 = await loadPumLogo()
    
    if (logoBase64) {
      // Draw logo (≈40 × 11 mm) on the left side of the header
      doc.addImage(logoBase64, "SVG", 15, 12, 40, 11)
    }
  } catch (e) {
    console.warn("Unable to embed PUM logo in PDF:", e)
    // Continue without logo if there's an error
  }
  
  // Add title
  doc.setFontSize(20)
  doc.setTextColor(29, 64, 175) // #1D40AF - PUM primary blue
  doc.text("Résultats de votre simulation", 105, 25, { align: "center" })
  
  /* -----------------------------------------------------------
   * 2️⃣  SIMULATION DATA : project information
   * --------------------------------------------------------- */
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text("Informations sur votre projet", 20, 40)
  
  doc.setFontSize(10)
  doc.text(
    `Volume de cuve recommandé: ${data.recommendedTankSize ? (data.recommendedTankSize / 1000).toFixed(1) : 0} m³`,
    20,
    50,
  )
  doc.text(
    `Eau récupérable par an: ${data.annualWaterCollectable ? (data.annualWaterCollectable / 1000).toFixed(1) : 0} m³`,
    20,
    60,
  )
  doc.text(
    `Besoins en eau par an: ${data.annualWaterNeeds ? (data.annualWaterNeeds / 1000).toFixed(1) : 0} m³`,
    20,
    70,
  )
  doc.text(`Taux de couverture: ${data.coverageRate ? data.coverageRate.toFixed(1) : 0}%`, 20, 80)
  doc.text(
    `Économie potentielle: ${data.potentialSavingsEuros ? data.potentialSavingsEuros.toFixed(2) : 0} €/an`,
    20,
    90,
  )
  
  /* -----------------------------------------------------------
   * 3️⃣  PRODUCT TABLES : tanks and pumps with references
   * --------------------------------------------------------- */
  // Section title
  doc.setFontSize(12)
  doc.setTextColor(29, 64, 175)
  doc.text("Produits recommandés", 20, 110)
  
  // Create a table for tanks
  const tankColumns = ["Référence", "Produit", "Type", "Volume"]
  const tankRows = recommendedTanks.map((tank) => [
    `Réf: ${tank.id}`,
    tank.name,
    tank.type === "aerial" ? "Aérien" : "Enterré",
    tank.volume ? `${tank.volume}L` : "-",
  ])
  
  autoTable(doc, {
    head: [tankColumns],
    body: tankRows,
    startY: 120,
    headStyles: { fillColor: [29, 64, 175] },
    styles: {
      font: "helvetica",
      lineColor: [220, 220, 220],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 255],
    },
  })
  
  // Add pump table if we have pumps
  if (recommendedPumps.length > 0) {
    const pumpY = (doc as any).lastAutoTable.finalY + 20
    
    doc.setFontSize(12)
    doc.setTextColor(29, 64, 175)
    doc.text("Pompes recommandées", 20, pumpY)
    
    // Pump table with reference column
    const pumpColumns = ["Référence", "Produit", "Type", "Compatibilité"]
    const pumpRows = recommendedPumps.map((pump) => [
      `Réf: ${pump.id}`,
      pump.name,
      "Pompe",
      pump.compatibleWithBuriedVolumes
        ? `Cuves ${pump.compatibleWithBuriedVolumes.join(", ")}L`
        : "Toutes cuves",
    ])
    
    autoTable(doc, {
      head: [pumpColumns],
      body: pumpRows,
      startY: pumpY + 10,
      headStyles: { fillColor: [29, 64, 175] },
      styles: {
        font: "helvetica",
        lineColor: [220, 220, 220],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 255],
      },
    })
  }
  
  /* -----------------------------------------------------------
   * 4️⃣  STORE LOCATOR : dynamic link with user's postal code
   * --------------------------------------------------------- */
  const locatorY = (doc as any).lastAutoTable?.finalY
    ? (doc as any).lastAutoTable.finalY + 25
    : 140
  
  // Use user's postal code or default to 92000
  const postal = data.postalCode || "92000"
  const storeUrl = `https://www.mypum.fr/agence?&s=${postal}`
  const label = "Trouvez votre agence PUM la plus proche : "
  
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.text(label, 20, locatorY)
  
  const linkX = 20 + doc.getTextWidth(label) + 1
  doc.setTextColor(29, 64, 175)
  
  // Add clickable link - handle compatibility with different jsPDF versions
  try {
    // @ts-ignore - textWithLink is supported in recent jsPDF versions
    doc.textWithLink(storeUrl, linkX, locatorY, { url: storeUrl })
  } catch {
    // Fallback for older jsPDF versions
    doc.text(storeUrl, linkX, locatorY)
    const w = doc.getTextWidth(storeUrl)
    doc.link(linkX, locatorY - 3, w, 6, { url: storeUrl })
  }
  
  /* -----------------------------------------------------------
   * 5️⃣  FOOTER : date and site reference
   * --------------------------------------------------------- */
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(
      "Simulation réalisée sur mypum.fr - " + new Date().toLocaleDateString("fr-FR"),
      105,
      doc.internal.pageSize.height - 10,
      { align: "center" },
    )
  }
  
  return doc
}

/**
 * Generates and saves/downloads a PDF with simulation results
 * 
 * @param data Simulation data
 * @param recommendedTanks Recommended tank products
 * @param recommendedPumps Recommended pump products
 * @param filename Optional custom filename (defaults to simulation-recuperation-eau-pluie.pdf)
 */
export async function downloadSimulationPDF(
  data: SimulatorData,
  recommendedTanks: Product[],
  recommendedPumps: Product[],
  filename = "simulation-recuperation-eau-pluie.pdf"
): Promise<void> {
  try {
    const doc = await generateSimulationPDF(data, recommendedTanks, recommendedPumps)
    doc.save(filename)
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw new Error("Impossible de générer le PDF. Veuillez réessayer.")
  }
}
