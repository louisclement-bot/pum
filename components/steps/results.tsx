"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { SimulatorData } from "../rainwater-simulator"
import { DropletIcon, Droplets, Banknote, BarChart3, ChevronRight, Share2, Printer } from "lucide-react"
import RainfallDetails from "../rainfall-details"
import { STEP_IDS } from "@/constants/steps"
import { motion } from "framer-motion"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useState } from "react"

type ResultsProps = {
  data: SimulatorData
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number, subStep?: number) => void
}

export default function Results({ data, nextStep, prevStep, goToStep }: ResultsProps) {
  const isMobile = useMediaQuery("(max-width: 640px)")
  const isTablet = useMediaQuery("(max-width: 1024px)")
  const [showShareOptions, setShowShareOptions] = useState(false)

  // Format numbers for display
  const formatNumber = (num: number | undefined, decimals = 0) => {
    if (num === undefined) return "0"
    return num.toLocaleString("fr-FR", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    })
  }

  // ------------------------------------------------------------------
  // Financial aid button – early-fetch aware
  // ------------------------------------------------------------------
  // Prefer the freshly fetched aids if present, otherwise keep the old
  // postal-code fallback so the UX isn’t broken if the early fetch fails.
  const aidsCount = data.financialAids?.length ?? 0
  const canShowFinancialAid = aidsCount > 0 || !!data.postalCode

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  }

  // Calculate coverage percentage for visual display
  const coveragePercentage = data.coverageRate || 0
  const coverageColor =
    coveragePercentage >= 90
      ? "bg-green-500 dark:bg-green-600"
      : coveragePercentage >= 70
        ? "bg-emerald-500 dark:bg-emerald-600"
        : coveragePercentage >= 50
          ? "bg-blue-500 dark:bg-blue-600"
          : coveragePercentage >= 30
            ? "bg-amber-500 dark:bg-amber-600"
            : "bg-red-500 dark:bg-red-600"

  // Handle share button click
  const handleShare = () => {
    setShowShareOptions(!showShareOptions)
  }

  // Handle print button click
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 md:space-y-8 print:space-y-4">
      <motion.div
        className="text-center mb-6 md:mb-8 print:mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-blue-800 dark:text-blue-300 mb-2 md:mb-3 print:text-black">
          Résultats de votre simulation
        </h2>
        <p className="text-blue-600 dark:text-blue-400 max-w-2xl mx-auto text-sm md:text-base print:text-gray-700">
          Voici les résultats basés sur vos informations. Nous avons calculé le volume optimal de cuve et les économies
          potentielles.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 print:gap-4 print:grid-cols-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <ResultCard
            icon={<Droplets className="h-8 w-8 md:h-10 md:w-10 text-blue-500 dark:text-blue-400 print:text-blue-700" />}
            title="Eau récupérable"
            value={`${formatNumber(data.annualWaterCollectable ? data.annualWaterCollectable / 1000 : 0, 1)} m³/an`}
            subtitle={`${formatNumber(data.annualWaterCollectable)} L/an`}
            color="blue"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <ResultCard
            icon={
              <DropletIcon className="h-8 w-8 md:h-10 md:w-10 text-blue-500 dark:text-blue-400 print:text-blue-700" />
            }
            title="Besoins en eau"
            value={`${formatNumber(data.annualWaterNeeds ? data.annualWaterNeeds / 1000 : 0, 1)} m³/an`}
            subtitle={`${formatNumber(data.annualWaterNeeds)} L/an`}
            color="blue"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <ResultCard
            icon={
              <BarChart3 className="h-8 w-8 md:h-10 md:w-10 text-blue-500 dark:text-blue-400 print:text-blue-700" />
            }
            title="Volume de cuve recommandé"
            value={`${formatNumber(data.recommendedTankSize ? data.recommendedTankSize / 1000 : 0, 1)} m³`}
            subtitle={`Pour ${data.autonomyWeeks} semaines d'autonomie`}
            highlight
            color="blue"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <ResultCard
            icon={<Banknote className="h-8 w-8 md:h-10 md:w-10 text-blue-500 dark:text-blue-400 print:text-blue-700" />}
            title="Économie potentielle"
            value={`${formatNumber(data.potentialSavingsEuros, 2)} €/an`}
            subtitle={`${formatNumber(data.potentialSavings, 1)} m³ d'eau potable économisés`}
            color="blue"
          />
        </motion.div>
      </motion.div>

      <motion.div
        className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 md:p-8 rounded-xl md:rounded-2xl shadow-soft mt-6 md:mt-10 transition-colors duration-300 border border-blue-100 dark:border-blue-900 print:bg-white print:border print:border-gray-300 print:shadow-none"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h3 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-blue-800 dark:text-blue-300 print:text-black">
          Taux de couverture des besoins
        </h3>

        <div className="relative w-full h-5 md:h-8 bg-white dark:bg-slate-800 rounded-full mb-4 md:mb-6 overflow-hidden shadow-inner print:border print:border-gray-300">
          <div
            className={`absolute top-0 left-0 h-full ${coverageColor} rounded-full transition-all duration-1000 print:bg-blue-500`}
            style={{ width: `${data.coverageRate}%` }}
          >
            <div className="absolute inset-0 bg-white/20 bg-[length:10px_10px] bg-[0_0] bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] animate-[gradient_1s_linear_infinite]"></div>
          </div>
          <div
            className={`absolute top-0 h-full flex items-center justify-center px-2 md:px-3 font-bold text-white text-xs md:text-sm print:text-white ${
              coveragePercentage < 30 ? "left-0 ml-2" : ""
            }`}
            style={{
              left: coveragePercentage < 30 ? "0" : `${Math.min(Math.max(data.coverageRate || 0, 30), 90)}%`,
              textShadow: "0px 0px 2px rgba(0,0,0,0.5)",
            }}
          >
            {formatNumber(data.coverageRate, 1)}%
          </div>
        </div>

        <div className="text-center">
          <p className="text-blue-700 dark:text-blue-300 text-sm md:text-base print:text-gray-800">
            <span className="font-bold">{formatNumber(data.coverageRate, 1)}%</span> de vos besoins en eau peuvent être
            couverts par l&apos;eau de pluie
          </p>

          <div className="mt-4 text-xs text-blue-600/70 dark:text-blue-400/70 print:hidden">
            {coveragePercentage >= 90
              ? "Excellent ! Votre installation est optimale."
              : coveragePercentage >= 70
                ? "Très bon taux de couverture."
                : coveragePercentage >= 50
                  ? "Bon taux de couverture."
                  : coveragePercentage >= 30
                    ? "Taux de couverture moyen. Envisagez d'augmenter la capacité de votre cuve."
                    : "Taux de couverture faible. Nous vous recommandons d'augmenter la capacité de votre cuve ou de réduire vos besoins."}
          </div>
        </div>
      </motion.div>

      {/* Rainfall Details Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="print:hidden"
      >
        <RainfallDetails data={data} className="mt-6 md:mt-10" />
      </motion.div>

      {/* Action buttons */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-6 md:mt-10 print:hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <Button
          variant="outline"
          onClick={prevStep}
          className="flex-1 py-2 md:py-3 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-sm md:text-base"
        >
          Précédent
        </Button>

        {canShowFinancialAid &&
          (aidsCount > 0 ? (
            <Button
              onClick={() => goToStep(STEP_IDS.FINANCIAL_AID)}
              className="flex-1 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white text-sm md:text-base"
            >
              {`Voir les ${aidsCount} aide${aidsCount > 1 ? "s" : ""} disponibles`}
              <ChevronRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
            </Button>
          ) : (
            !!data.postalCode && (
              <Button
                onClick={() => goToStep(STEP_IDS.FINANCIAL_AID)}
                className="flex-1 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white text-sm md:text-base"
              >
                Voir les aides disponibles
                <ChevronRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
              </Button>
            )
          ))}

        <Button
          onClick={() => goToStep(STEP_IDS.PRODUCTS)}
          className="flex-1 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white text-sm md:text-base"
        >
          Voir les produits recommandés
          <ChevronRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
        </Button>
      </motion.div>

      {/* Share and Print buttons */}
      <motion.div
        className="flex justify-center gap-4 mt-6 print:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400"
          >
            <Share2 className="h-4 w-4" />
            {!isMobile && "Partager"}
          </Button>

          {showShareOptions && (
            <div className="absolute top-full mt-2 left-0 bg-white dark:bg-slate-800 shadow-lg rounded-lg p-2 z-10 border border-gray-200 dark:border-gray-700 min-w-[200px]">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left mb-1"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "Résultats de ma simulation de récupération d'eau de pluie",
                      text: `J'ai calculé que je peux récupérer ${formatNumber(data.annualWaterCollectable ? data.annualWaterCollectable / 1000 : 0, 1)} m³ d'eau par an et économiser ${formatNumber(data.potentialSavingsEuros, 2)} € par an.`,
                    })
                  }
                  setShowShareOptions(false)
                }}
              >
                Partager via l'appareil
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `J'ai calculé que je peux récupérer ${formatNumber(data.annualWaterCollectable ? data.annualWaterCollectable / 1000 : 0, 1)} m³ d'eau par an et économiser ${formatNumber(data.potentialSavingsEuros, 2)} € par an avec une cuve de ${formatNumber(data.recommendedTankSize ? data.recommendedTankSize / 1000 : 0, 1)} m³.`,
                  )
                  setShowShareOptions(false)
                }}
              >
                Copier le texte
              </Button>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400"
        >
          <Printer className="h-4 w-4" />
          {!isMobile && "Imprimer"}
        </Button>
      </motion.div>

      {/* Print-only summary */}
      <div className="hidden print:block mt-8 border-t pt-4 text-sm">
        <h3 className="font-bold text-lg mb-2">Résumé de la simulation</h3>
        <p>Date: {new Date().toLocaleDateString()}</p>
        <p>Surface de toit: {data.roofSurface} m²</p>
        <p>Pluviométrie annuelle: {data.annualRainfall} mm/an</p>
        <p>Autonomie souhaitée: {data.autonomyWeeks} semaines</p>
        <p className="mt-4 text-xs">Simulation réalisée sur mypum.fr</p>
      </div>
    </div>
  )
}

type ResultCardProps = {
  icon: React.ReactNode
  title: string
  value: string
  subtitle: string
  highlight?: boolean
  color?: "blue" | "green"
}

function ResultCard({ icon, title, value, subtitle, highlight = false, color = "blue" }: ResultCardProps) {
  const gradientClass =
    color === "blue"
      ? "from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30"
      : "from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30"

  const borderClass = highlight
    ? color === "blue"
      ? "border-blue-400 dark:border-blue-600"
      : "border-green-400 dark:border-green-600"
    : "border-transparent"

  const shadowClass = highlight ? "shadow-glow" : "shadow-soft"

  return (
    <Card
      className={`border-2 ${borderClass} overflow-hidden ${shadowClass} transition-all duration-300 hover:shadow-lg print:border print:border-gray-300 print:shadow-none print:hover:shadow-none`}
    >
      <div className={`bg-gradient-to-br ${gradientClass} p-1 transition-colors duration-300 print:bg-white`}>
        <CardContent className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 md:p-6 transition-colors duration-300 print:bg-white print:p-4">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="mt-1 print:text-blue-700">{icon}</div>
            <div>
              <h3 className="font-medium text-gray-600 dark:text-gray-300 text-sm md:text-base print:text-gray-700">
                {title}
              </h3>
              <div className="text-xl md:text-3xl font-bold mt-1 text-gray-900 dark:text-white print:text-black">
                {value}
              </div>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1 print:text-gray-600">{subtitle}</p>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
