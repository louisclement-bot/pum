"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { SimulatorData } from "../rainwater-simulator"
import {
  Printer,
  MapPin,
  RefreshCw,
  ShoppingCart,
  Check,
  Droplets,
  Gauge,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  getRecommendedTanks,
  getAdditionalRecommendedTanks,
  getCompatiblePumps,
  isBestsellerProduct,
  getProductFeatures,
  type Product,
} from "@/lib/productService"
import { downloadSimulationPDF } from "@/lib/pdfGenerator"

type RecommendedProductsProps = {
  data: SimulatorData
  prevStep: () => void
  restart: () => void
}

export default function RecommendedProducts({ data, prevStep, restart }: RecommendedProductsProps) {
  const [recommendedTanks, setRecommendedTanks] = useState<Product[]>([])
  const [additionalTanks, setAdditionalTanks] = useState<Product[]>([])
  const [recommendedPumps, setRecommendedPumps] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfGenerating, setPdfGenerating] = useState(false)

  const [showAllTanks, setShowAllTanks] = useState(false)

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true)
      setError(null)

      try {
        // Get tank recommendations based on calculated size and usage
        const tanks = await getRecommendedTanks(
          data.recommendedTankSize || 0,
          data.usages || [],
          3, // Limit to 3 tanks
        )
        setRecommendedTanks(tanks)

        // Get additional 9 tanks (max) for "Voir plus", excluding the top 3
        const moreTanks = await getAdditionalRecommendedTanks(
          data.recommendedTankSize || 0,
          data.usages || [],
          tanks,
        )
        setAdditionalTanks(moreTanks)

        // Get compatible pumps based on usage AND recommended tanks
        // Pass the tanks to getCompatiblePumps for better pump recommendations
        const pumps = await getCompatiblePumps(data.usages || [], tanks)
        setRecommendedPumps(pumps)
      } catch (error) {
        console.error("Error loading product recommendations:", error)
        setError("Impossible de charger les produits recommandés. Veuillez réessayer.")

        // Fallback to dummy data if API fails
        setRecommendedTanks(getTankRecommendations(data.recommendedTankSize || 0))
        setRecommendedPumps(getPumpRecommendations(data.usages || []))
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [data.recommendedTankSize, data.usages])

  // Determine which tanks to display based on showAllTanks state
  const tanksToDisplay = showAllTanks ? [...recommendedTanks, ...additionalTanks] : recommendedTanks

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1D40AF] dark:text-blue-300 mb-2 md:mb-3">
          Produits recommandés pour votre projet
        </h2>
        <p className="text-blue-600 dark:text-blue-400 max-w-2xl mx-auto text-sm md:text-base">
          Voici notre sélection de produits adaptés à vos besoins spécifiques.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D40AF]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <>
          <section>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 md:p-2 rounded-full mr-2 md:mr-3 transition-colors duration-300">
                  <Droplets className="h-5 w-5 md:h-6 md:w-6 text-[#1D40AF] dark:text-blue-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-[#1D40AF] dark:text-blue-300">
                  Cuves recommandées
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllTanks(!showAllTanks)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {showAllTanks ? (
                  <>
                    <ChevronUp className="mr-1 h-4 w-4" />
                    Voir moins
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-4 w-4" />
                    Voir plus
                  </>
                )}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {tanksToDisplay.map((tank) => (
                <ProductCard
                  key={tank.id}
                  product={tank}
                  isBestseller={isBestsellerProduct(tank, data.recommendedTankSize || 0, data.usages || [])}
                />
              ))}
            </div>
          </section>

          <section className="mt-8 md:mt-12">
            <div className="flex items-center mb-4 md:mb-6">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 md:p-2 rounded-full mr-2 md:mr-3 transition-colors duration-300">
                <Gauge className="h-5 w-5 md:h-6 md:w-6 text-[#1D40AF] dark:text-blue-400" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-[#1D40AF] dark:text-blue-300">
                Kits pompes recommandés
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {recommendedPumps.map((pump) => (
                <ProductCard
                  key={pump.id}
                  product={pump}
                  isBestseller={isBestsellerProduct(pump, data.recommendedTankSize || 0, data.usages || [])}
                />
              ))}
            </div>
          </section>
        </>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 md:p-8 rounded-xl md:rounded-2xl shadow-soft mt-6 md:mt-10 transition-colors duration-300 border border-blue-100 dark:border-blue-900">
        <div className="flex items-center mb-3 md:mb-4">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 md:p-2 rounded-full mr-2 md:mr-3 transition-colors duration-300">
            <Info className="h-4 w-4 md:h-5 md:w-5 text-[#1D40AF] dark:text-blue-400" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-[#1D40AF] dark:text-blue-300">
            Installation et maintenance
          </h3>
        </div>
        <p className="text-blue-700 dark:text-blue-300 text-sm md:text-base">
          L&apos;installation d&apos;un système de récupération d&apos;eau de pluie nécessite des compétences
          techniques. Nous vous recommandons de faire appel à un professionnel pour l&apos;installation. La maintenance
          régulière est essentielle pour garantir le bon fonctionnement de votre système.
        </p>
      </div>

      {/* Action buttons (left group + right-aligned "point de vente") */}
      <div className="flex justify-between flex-wrap gap-3 md:gap-4 mt-6 md:mt-10">
        {/* Left group */}
        <div className="flex flex-wrap gap-3 md:gap-4">
        <Button
          variant="outline"
          onClick={prevStep}
          className="flex-1 sm:flex-none py-2 md:py-6 border-blue-200 dark:border-blue-800 text-[#1D40AF] dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-sm md:text-base"
        >
          Précédent
        </Button>

        <Button
          variant="outline"
          onClick={async () => {
            try {
              setPdfGenerating(true);
              await downloadSimulationPDF(data, recommendedTanks, recommendedPumps);
            } catch (error) {
              console.error("Error generating PDF:", error);
              alert("Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.");
            } finally {
              setPdfGenerating(false);
            }
          }}
          disabled={pdfGenerating}
          className="flex-1 sm:flex-none py-2 md:py-6 border-blue-200 dark:border-blue-800 text-[#1D40AF] dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-sm md:text-base"
        >
          <Printer className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
          {pdfGenerating ? "Génération..." : "Imprimer"}
        </Button>

        {/* Recommencer – now outline */}
        <Button
          variant="outline"
          onClick={restart}
          className="flex-1 sm:flex-none py-2 md:py-6 border-blue-200 dark:border-blue-800 text-[#1D40AF] dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-sm md:text-base"
        >
          <RefreshCw className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
          Recommencer
        </Button>

        </div>

        {/* Right-aligned "Trouver un point de vente" */}
        <Button
          onClick={() => {
            const baseUrl = "https://www.mypum.fr/agence"
            const url = data.postalCode ? `${baseUrl}?s=${encodeURIComponent(data.postalCode)}` : baseUrl
            window.open(url, "_blank")
          }}
          className="flex-1 sm:flex-none py-2 md:py-6 bg-[#1D40AF] hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white text-sm md:text-base"
        >
          <MapPin className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
          Trouver un point de vente
        </Button>
      </div>
    </div>
  )
}

type ProductCardProps = {
  product: Product
  isBestseller?: boolean
}

function ProductCard({ product, isBestseller = false }: ProductCardProps) {
  // Get features based on product properties
  const features = getProductFeatures(product)

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg group dark:bg-slate-800 dark:border-slate-700 border border-blue-100 h-full flex flex-col">
      <div className="relative">
        {/* White base + subtle gradient; product image always on top */}
        <div className="aspect-video bg-white relative flex items-center justify-center overflow-hidden">
          {/* Gradient overlay kept behind the image */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 z-0"></div>

          {/* Product image */}
          <img
            src={product.imageUrl || "/placeholder.svg"}
            alt={product.name}
            className="relative z-10 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement
              if (target.src !== "/placeholder.svg") {
                target.src = "/placeholder.svg"
              }
            }}
          />
        </div>
        {isBestseller && (
          <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-[#1D40AF] text-white text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-md">
            BESTSELLER
          </div>
        )}
        <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-blue-100 dark:bg-blue-900/70 text-[#1D40AF] dark:text-blue-200 text-xs font-medium px-2 py-0.5 md:px-3 md:py-1 rounded-full">
          {product.type === "aerial" ? "Aérien" : product.type === "buried" ? "Enterré" : "Pompe"}
        </div>
      </div>
      <CardContent className="p-4 md:p-6 flex flex-col flex-1">
        <div className="flex-1">
          <h4 className="font-bold text-base md:text-lg text-[#1D40AF] dark:text-blue-300">{product.name}</h4>

          {product.volume && (
            <div className="mt-1 md:mt-2 text-xs md:text-sm">
              <span className="text-gray-600 dark:text-gray-300 font-medium">Capacité:</span>{" "}
              <span className="dark:text-gray-300">{product.volume} litres</span>
            </div>
          )}

          {features.length > 0 && (
            <ul className="mt-2 md:mt-3 text-xs md:text-sm space-y-1 md:space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-0.5 md:p-1 rounded-full mr-1.5 md:mr-2 mt-0.5 transition-colors duration-300">
                    <Check className="h-2 w-2 md:h-3 md:w-3 text-[#1D40AF] dark:text-blue-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 md:mt-4 flex justify-end">
          <Button
            size="sm"
            className="bg-[#1D40AF] hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white text-xs md:text-sm py-1 md:py-2"
            onClick={() => window.open(product.productUrl, "_blank")}
          >
            <ShoppingCart className="mr-1 h-3 w-3 md:h-4 md:w-4" />
            Voir détails
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Fallback functions in case the API fails
function getTankRecommendations(tankSize: number): Product[] {
  return [
    {
      id: "tank1",
      name: "Cuve aérienne 500L",
      type: "aerial",
      volume: 500,
      usage: "Exterior Only",
      compatibleWithBuriedVolumes: null,
      productUrl: "https://www.mypum.fr",
      imageUrl: "/placeholder.svg?key=lliq2",
    },
    {
      id: "tank2",
      name: "Cuve enterrée 2000L",
      type: "buried",
      volume: 2000,
      usage: "Interior/Exterior",
      compatibleWithBuriedVolumes: null,
      productUrl: "https://www.mypum.fr",
      imageUrl: "/placeholder.svg?key=wexud",
    },
    {
      id: "tank3",
      name: "Cuve enterrée 5000L",
      type: "buried",
      volume: 5000,
      usage: "Interior/Exterior",
      compatibleWithBuriedVolumes: null,
      productUrl: "https://www.mypum.fr",
      imageUrl: "/placeholder.svg?key=vd48n",
    },
  ]
}

function getPumpRecommendations(usages: string[]): Product[] {
  const pumps: Product[] = []

  if (usages.includes("garden")) {
    pumps.push({
      id: "pump1",
      name: "Kit pompe jardin",
      type: "pump",
      volume: null,
      usage: null,
      compatibleWithBuriedVolumes: [3000, 5000],
      productUrl: "https://www.mypum.fr",
      imageUrl: "/placeholder.svg?key=7f7wm",
    })
  }

  if (usages.includes("toilet") || usages.includes("washing")) {
    pumps.push({
      id: "pump2",
      name: "Kit pompe habitat",
      type: "pump",
      volume: null,
      usage: null,
      compatibleWithBuriedVolumes: [3000, 5000, 8000],
      productUrl: "https://www.mypum.fr",
      imageUrl: "/placeholder.svg?key=yfhnc",
    })
  }

  // If no specific usages or empty array, provide a default option
  if (pumps.length === 0) {
    pumps.push({
      id: "pump4",
      name: "Kit pompe standard",
      type: "pump",
      volume: null,
      usage: null,
      compatibleWithBuriedVolumes: [3000, 5000],
      productUrl: "https://www.mypum.fr",
      imageUrl: "/placeholder.svg?key=xxudu",
    })
  }

  return pumps
}
