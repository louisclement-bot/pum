"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { SimulatorData } from "../rainwater-simulator"
import { useState } from "react"
import { Euro, Building, MapPin, Info, ExternalLink, ChevronDown, ChevronUp, Phone, Mail, FileText } from "lucide-react"
import type { Aid } from "@/types/financialAidTypes"

type FinancialAidProps = {
  data: SimulatorData
  nextStep: () => void
  prevStep: () => void
}

export default function FinancialAid({ data, nextStep, prevStep }: FinancialAidProps) {
  // Offline-first: rely on early-fetched data coming from SimulatorData
  const aids: Aid[] = data.financialAids ?? []
  const isLoading = data.financialAids === undefined
  // Placeholder for potential future error propagation via SimulatorData
  const error: string | null = null
  
  // State to track expanded aid cards
  const [expandedAids, setExpandedAids] = useState<Record<string, boolean>>({})
  
  // Toggle expanded state for an aid
  const toggleExpand = (aidId: string) => {
    setExpandedAids(prev => ({
      ...prev,
      [aidId]: !prev[aidId]
    }))
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1D40AF] dark:text-blue-300 mb-3">
          Aides financières disponibles dans votre région
        </h2>
        <p className="text-blue-600 dark:text-blue-400 max-w-2xl mx-auto text-sm md:text-base">
          Découvrez les aides financières auxquelles vous pourriez être éligible pour votre projet de récupération d&apos;eau
          de pluie.
        </p>
      </div>

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
                  <h3 className="font-bold text-xl text-[#1D40AF] dark:text-blue-300 mb-4">{aid.name}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Building className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                        <span className="text-gray-600 dark:text-gray-400">Organisme:</span>
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{aid.organization}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Euro className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                        <span className="text-gray-600 dark:text-gray-400">Montant:</span>
                      </div>
                      <span className="font-medium text-[#1D40AF] dark:text-blue-300">{aid.amount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                        <span className="text-gray-600 dark:text-gray-400">Conditions:</span>
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{aid.conditions}</span>
                    </div>
                    
                    {/* Expand/Collapse button */}
                    <Button 
                      variant="ghost" 
                      onClick={() => toggleExpand(aid.id)}
                      className="w-full mt-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <span className="flex items-center">
                        {expandedAids[aid.id] ? (
                          <>Moins de détails <ChevronUp className="ml-2 h-4 w-4" /></>
                        ) : (
                          <>Plus de détails <ChevronDown className="ml-2 h-4 w-4" /></>
                        )}
                      </span>
                    </Button>
                    
                    {/* Expanded details */}
                    {expandedAids[aid.id] && (
                      <div className="mt-4 space-y-4 pt-4 border-t border-blue-100 dark:border-blue-800">
                        {/* Description */}
                        {aid.description && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-[#1D40AF] dark:text-blue-300">Description</h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">{aid.description}</p>
                          </div>
                        )}
                        
                        {/* Program description */}
                        {aid.programDescription && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-[#1D40AF] dark:text-blue-300">À propos du programme</h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">{aid.programDescription}</p>
                          </div>
                        )}
                        
                        {/* Links */}
                        <div className="flex flex-wrap gap-2">
                          {aid.website && (
                            <a 
                              href={aid.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Site officiel
                            </a>
                          )}
                          
                          {aid.documentationLink && (
                            <a 
                              href={aid.documentationLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Documentation
                            </a>
                          )}
                        </div>
                        
                        {/* Contact information */}
                        {(aid.address || aid.city || aid.postalCode || aid.phone || aid.email) && (
                          <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md">
                            <h4 className="font-medium text-[#1D40AF] dark:text-blue-300">Contact</h4>
                            
                            {(aid.address || aid.city || aid.postalCode) && (
                              <div className="flex items-start">
                                <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2 mt-0.5" />
                                <div>
                                  {aid.address && <p className="text-sm text-gray-700 dark:text-gray-300">{aid.address}</p>}
                                  {(aid.city || aid.postalCode) && (
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      {aid.postalCode} {aid.city}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {aid.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                                <a href={`tel:${aid.phone}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                  {aid.phone}
                                </a>
                              </div>
                            )}
                            
                            {aid.email && (
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                                <a href={`mailto:${aid.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                  {aid.email}
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-100 dark:border-red-800 max-w-3xl mx-auto">
          <div className="flex items-center mb-4">
            <Info className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
            <h3 className="text-lg font-medium text-red-700 dark:text-red-300">Erreur</h3>
          </div>
          <p className="text-red-700 dark:text-red-300 ml-9">{error}</p>
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
            Aucune aide financière n&apos;est disponible dans votre région pour la récupération d&apos;eau de pluie.
            Cela peut changer, n&apos;hésitez pas à consulter régulièrement notre site ou à contacter votre mairie.
          </p>
        </div>
      )}

      {/* Updated button section - "Voir les produits recommandés" moved to the right */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-10">
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
