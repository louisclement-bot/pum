import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { SimulatorData } from "@/components/rainwater-simulator"
import type { Product } from "@/lib/productService"

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
    // Load PNG logo
    const res = await fetch("/images/pum-logo.png")
    if (res.ok) {
      const buffer = await res.arrayBuffer()
      // Draw logo (≈40 × 11 mm) on the left side of the header
      doc.addImage(buffer, "PNG", 15, 12, 40, 11)
    } else {
      console.warn("Unable to fetch PUM PNG logo, status:", res.status)
    }
  } catch (e) {
    console.warn("Unable to embed PUM PNG logo in PDF:", e)
  }
  
  // Add title
  doc.setFontSize(20)
  doc.setTextColor(29, 64, 175) // #1D40AF - PUM primary blue
  doc.text("Résultats de votre simulation", 105, 25, { align: "center" })
  
  /* -----------------------------------------------------------
   * 2️⃣  SIMULATION DATA : project information with card layout
   * --------------------------------------------------------- */
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text("Informations sur votre projet", 20, 40)
  
  // Define card styling
  const cardBgColor = [245, 248, 255]; // Light blue background
  const cardBorderColor = [220, 230, 245]; // Light blue border
  const cardWidth = 85;
  const cardHeight = 25;
  const cardSpacing = 10;
  const iconSize = 6;
  
  // Calculate positions for 2x2 grid layout
  const startY = 45;
  const col1X = 20;
  const col2X = col1X + cardWidth + cardSpacing;
  const row1Y = startY;
  const row2Y = row1Y + cardHeight + cardSpacing;
  
  // Helper function to draw a card with icon and text
  function drawCard(x: number, y: number, title: string, value: string, iconChar: string) {
    // Draw card background with rounded corners
    doc.setFillColor(...cardBgColor);
    doc.setDrawColor(...cardBorderColor);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');
    
    // Draw icon circle
    doc.setFillColor(29, 64, 175); // PUM blue
    doc.circle(x + 8, y + 8, 4, 'F');
    
    // Add icon text
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(iconChar, x + 8, y + 8, { align: 'center' });
    
    // Add title
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text(title, x + 18, y + 7);
    
    // Add value
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.text(value, x + 18, y + 16);
  }
  
  // Draw the four metric cards
  drawCard(
    col1X, row1Y, 
    "Eau récupérable", 
    `${(data.annualWaterCollectable! / 1000).toFixed(0)} m³/an`,
    "💧"
  );
  
  drawCard(
    col2X, row1Y, 
    "Besoins en eau", 
    `${(data.annualWaterNeeds! / 1000).toFixed(0)} m³/an`,
    "🚰"
  );
  
  drawCard(
    col1X, row2Y, 
    "Volume de cuve recommandé", 
    `${(data.recommendedTankSize! / 1000).toFixed(1)} m³`,
    "📊"
  );
  
  drawCard(
    col2X, row2Y, 
    "Économie potentielle", 
    `${Math.ceil(data.potentialSavingsEuros!)} €/an`,
    "💰"
  );
  
  /* -----------------------------------------------------------
   * 2.5️⃣  COVERAGE GAUGE : visual representation
   * --------------------------------------------------------- */
  const gaugeY = row2Y + cardHeight + 15;
  
  // Title for coverage section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(29, 64, 175); // PUM blue
  doc.text("Taux de couverture des besoins", 20, gaugeY);
  
  // Draw gauge background
  const gaugeWidth = 170;
  const gaugeHeight = 10;
  const gaugeX = 20;
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(gaugeX, gaugeY + 5, gaugeWidth, gaugeHeight, 5, 5, 'F');
  
  // Draw filled portion based on coverage rate
  const coverageRate = data.coverageRate || 0;
  const filledWidth = (coverageRate / 100) * gaugeWidth;
  
  // Choose color based on coverage rate
  let fillColor;
  if (coverageRate >= 90) fillColor = [39, 174, 96]; // green
  else if (coverageRate >= 70) fillColor = [46, 204, 113]; // lighter green
  else if (coverageRate >= 50) fillColor = [52, 152, 219]; // blue
  else if (coverageRate >= 30) fillColor = [241, 196, 15]; // yellow
  else fillColor = [231, 76, 60]; // red
  
  doc.setFillColor(...fillColor);
  doc.roundedRect(gaugeX, gaugeY + 5, filledWidth, gaugeHeight, 5, 5, 'F');
  
  // Add percentage text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`${coverageRate.toFixed(1)}%`, gaugeX + filledWidth - 5, gaugeY + 10);
  
  // Add explanation text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `${coverageRate.toFixed(1)}% de vos besoins en eau peuvent être couverts par l'eau de pluie`,
    105, gaugeY + 25, { align: "center" }
  );
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Très bon taux de couverture.", 105, gaugeY + 32, { align: "center" });
  
  /* -----------------------------------------------------------
   * 3️⃣  PRODUCT TABLES : tanks and pumps with references
   * --------------------------------------------------------- */
  // Section title - position after the gauge section
  const productsStartY = gaugeY + 40;
  doc.setFontSize(12);
  doc.setTextColor(29, 64, 175);
  doc.text("Produits recommandés", 20, productsStartY);
  
  // Dynamically position tank table right after the section title
  const tankStartY = productsStartY + 5;
  // Create a table for tanks with reference column
  const tankColumns = ["Référence", "Produit", "Type", "Volume"];
  const tankRows = recommendedTanks.map((tank) => [
    `Réf: ${tank.id}`,
    tank.name,
    tank.type === "aerial" ? "Aérien" : "Enterré",
    tank.volume ? `${tank.volume}L` : "-",
  ]);
  
  autoTable(doc, {
    head: [tankColumns],
    body: tankRows,
    startY: tankStartY,
    headStyles: { fillColor: [29, 64, 175] },
    styles: {
      font: "helvetica",
      lineColor: [220, 220, 220],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 255],
    },
  });
  
  // Add pump table if we have pumps
  if (recommendedPumps.length > 0) {
    // Place pump section after the tank table
    const pumpY = (doc as any).lastAutoTable.finalY + 20;
    
    doc.setFontSize(12);
    doc.setTextColor(29, 64, 175);
    doc.text("Pompes recommandées", 20, pumpY);
    
    // Pump table – only useful columns
    const pumpColumns = ["Référence", "Produit"];
    const pumpRows = recommendedPumps.map((pump) => [`Réf: ${pump.id}`, pump.name]);
    
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
    });
  }
  
  /* -----------------------------------------------------------
   * 4️⃣  STORE LOCATOR : dynamic link with user's postal code
   * --------------------------------------------------------- */
  const locatorY = (doc as any).lastAutoTable?.finalY
    ? (doc as any).lastAutoTable.finalY + 25
    : 140;
  
  // Use user's postal code or default to 92000
  const postal = data.postalCode || "92000";
  const storeUrl = `https://www.mypum.fr/agence?&s=${postal}`;
  const label = "Trouvez votre agence PUM la plus proche : ";
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(label, 20, locatorY);
  
  const linkX = 20 + doc.getTextWidth(label) + 1;
  doc.setTextColor(29, 64, 175);
  
  // Add clickable link - handle compatibility with different jsPDF versions
  try {
    // @ts-ignore - textWithLink is supported in recent jsPDF versions
    doc.textWithLink(storeUrl, linkX, locatorY, { url: storeUrl });
  } catch {
    // Fallback for older jsPDF versions
    doc.text(storeUrl, linkX, locatorY);
    const w = doc.getTextWidth(storeUrl);
    doc.link(linkX, locatorY - 3, w, 6, { url: storeUrl });
  }
  
  /* -----------------------------------------------------------
   * 5️⃣  FOOTER : date and site reference
   * --------------------------------------------------------- */
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "Simulation réalisée sur mypum.fr - " + new Date().toLocaleDateString("fr-FR"),
      105,
      doc.internal.pageSize.height - 10,
      { align: "center" },
    );
  }
  
  return doc;
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
    const doc = await generateSimulationPDF(data, recommendedTanks, recommendedPumps);
    doc.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Impossible de générer le PDF. Veuillez réessayer.");
  }
}
