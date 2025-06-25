"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { SimulatorData } from "../rainwater-simulator"
import { useState } from "react"
import {
  Euro,
  Building,
  MapPin,
  Info,
  Edit3,
  ExternalLink,
  Mail,
  Phone,
  FileText,
  Home,
} from "lucide-react"
import type { Aid } from "@/types/financialAidTypes"

type FinancialAidProps = {
  data: SimulatorData
  nextStep: () => void
  prevStep: () => void
  /** Navigate to a specific simulator step (stepId, subStepId) */
  goToStep?: (step: number, subStep?: number) => void
}

export default function FinancialAid({ data, nextStep, prevStep, goToStep }: FinancialAidProps) {
  /**
   * Offline-first: aids are fetched upstream (Rainfall step) and injected
   * into SimulatorData.  If the field is still `undefined`, we assume the
   * early-fetch is pending (user navigated very fast) and keep the loading
   * skeleton for a better UX.
   */
  const isLoading = data.financialAids === undefined
  const aids: Aid[] = data.financialAids ?? []
  const [expandedAids, setExpandedAids] = useState<Record<string, boolean>>({})

  // Toggle expanded state for an aid
  const toggleExpand = (id: string) => {
    setExpandedAids((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1D40AF] dark:text-blue-300 mb-3">
          Aides financières disponibles dans votre région
        </h2>
        <p className="text-blue-600 dark:text-blue-400 max-w-2xl mx-auto text-sm md:text-base">
          Découvrez les aides financières auxquelles vous pourriez être éligible pour votre projet de récupération d'eau
          de pluie.
        </p>
      </div>

      {/* ────────────────────────────────
         Location information + manual edit
         Shown only when a city is already known
         ──────────────────────────────── */}
      {data.city && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 md:p-6 rounded-xl border border-blue-100 dark:border-blue-800 flex flex-col items-start max-w-3xl mx-auto">
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-800/50 p-2 rounded-full mr-3">
              <MapPin className="h-5 w-5 text-[#1D40AF] dark:text-blue-400" />
            </div>
            <p className="text-[#1D40AF] dark:text-blue-300 font-medium">
              Basé sur votre adresse à <span className="font-bold">{data.city}</span>
            </p>
          </div>

          <Button
            variant="link"
            onClick={() => goToStep?.(2, 3)}
            className="mt-3 text-blue-600 dark:text-blue-400"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Modifier manuellement
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4 max-w-3xl mx-auto">
          <Card className="border border-blue-100 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-blue-100 dark:bg-blue-800/50 rounded w-3/4"></div>
                <div className="h-4 bg-blue-50 dark:bg-blue-900/30 rounded w-1/2 mt-4"></div>
                <div className="h-4 bg-blue-50 dark:bg-blue-900/30 rounded w-5/6"></div>
                <div className="h-4 bg-blue-50 dark:bg-blue-900/30 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-blue-100 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-blue-100 dark:bg-blue-800/50 rounded w-2/3"></div>
                <div className="h-4 bg-blue-50 dark:bg-blue-900/30 rounded w-1/2 mt-4"></div>
                <div className="h-4 bg-blue-50 dark:bg-blue-900/30 rounded w-5/6"></div>
                <div className="h-4 bg-blue-50 dark:bg-blue-900/30 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : aids.length > 0 ? (
        <div className="space-y-4 max-w-3xl mx-auto">
          {aids.map((aid) => (
            <Card key={aid.id} className="border border-blue-100 dark:border-blue-800 overflow-hidden">
              <CardContent className="p-0">
                <div className="border-l-4 border-[#1D40AF] dark:border-blue-500 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-xl text-[#1D40AF] dark:text-blue-300">{aid.name}</h3>
                  </div>
                  
                  {/* Basic information - always visible */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-[auto_1fr] gap-2 items-start">
                      <div className="flex items-center">
                        <Building className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                        <span className="text-gray-600 dark:text-gray-400">Organisme:</span>
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-200 text-right break-words">
                        {aid.organization}
                      </span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] gap-2 items-start">
                      <div className="flex items-center">
                        <Euro className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                        <span className="text-gray-600 dark:text-gray-400">Montant:</span>
                      </div>
                      <span className="font-medium text-[#1D40AF] dark:text-blue-300 text-right break-words">
                        {aid.amount}
                      </span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] gap-2 items-start">
                      <div className="flex items-center">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                        <span className="text-gray-600 dark:text-gray-400">Conditions:</span>
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-200 text-right break-words">
                        {aid.conditions}
                      </span>
                    </div>
                  </div>

                  {/* Toggle details button */}
                  <div className="mt-4">
                    <Button
                      onClick={() => toggleExpand(aid.id)}
                      variant="outline"
                      className="border-blue-200 dark:border-blue-700 text-[#1D40AF] dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      aria-expanded={expandedAids[aid.id] ? "true" : "false"}
                    >
                      {expandedAids[aid.id] ? "Voir moins" : "Voir plus"}
                    </Button>
                  </div>
                  
                  {/* Expanded information - visible only when expanded */}
                  {expandedAids[aid.id] && (
                    <div className="mt-5 pt-5 border-t border-blue-100 dark:border-blue-800 space-y-4">
                      {/* Description */}
                      {aid.description && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{aid.description}</p>
                        </div>
                      )}
                      
                      {/* Program Description */}
                      {aid.programDescription && (
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">À propos du programme</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{aid.programDescription}</p>
                        </div>
                      )}
                      
                      {/* Contact Information */}
                      {(aid.address || aid.city || aid.postalCode || aid.phone || aid.email) && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact</h4>
                          
                          {/* Address */}
                          {aid.address && (
                            <div className="flex items-start text-sm">
                              <Home className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {aid.address}
                                {(aid.city || aid.postalCode) && (
                                  <>
                                    <br />
                                    {aid.postalCode && <span>{aid.postalCode} </span>}
                                    {aid.city && <span>{aid.city}</span>}
                                  </>
                                )}
                              </span>
                            </div>
                          )}
                          
                          {/* Phone */}
                          {aid.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0" />
                              <a 
                                href={`tel:${aid.phone.replace(/\s/g, '')}`} 
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {aid.phone}
                              </a>
                            </div>
                          )}
                          
                          {/* Email */}
                          {aid.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0" />
                              <a 
                                href={`mailto:${aid.email}`} 
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {aid.email}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Links */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        {/* Website */}
                        {aid.website && (
                          <a 
                            href={aid.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4 mr-1.5" />
                            Site web
                          </a>
                        )}
                        
                        {/* Documentation */}
                        {aid.documentationLink && (
                          <a 
                            href={aid.documentationLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                          >
                            <FileText className="h-4 w-4 mr-1.5" />
                            Documentation
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex items-start mt-6">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Ces informations sont données à titre indicatif. Veuillez contacter les organismes concernés pour plus de
              détails et vérifier votre éligibilité.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-100 dark:border-blue-800 max-w-3xl mx-auto">
          <div className="flex items-center mb-4">
            <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h3 className="text-lg font-medium text-[#1D40AF] dark:text-blue-300">
              Aucune aide disponible dans votre région
            </h3>
          </div>
          <p className="text-blue-700 dark:text-blue-300 ml-9">
            Aucune aide financière n'est disponible dans votre région pour la récupération d'eau de pluie.
            Cela peut changer, n'hésitez pas à consulter régulièrement notre site ou à contacter votre mairie.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mt-10">
        <Button
          variant="outline"
          onClick={prevStep}
          className="py-2 md:py-3 px-6 rounded-xl border-blue-200 dark:border-blue-800 text-[#1D40AF] dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-300"
        >
          Précédent
        </Button>

        <Button
          onClick={nextStep}
          className="py-2 md:py-3 px-6 rounded-xl bg-[#1D40AF] hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
        >
          Voir les produits recommandés
        </Button>
      </div>
    </div>
  )
}
