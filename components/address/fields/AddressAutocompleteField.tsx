"use client"

import AddressAutocomplete from "@/components/ui-elements/address-autocomplete"
import { useAddressSearch } from "@/contexts/AddressSearchContext"

export default function AddressAutocompleteField() {
  const { state, updateState, handleAddressSelect } = useAddressSearch()
  const { address, isSearching, error } = state

  return (
    <div className="space-y-3">
      <label className="block text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
        Quelle est votre adresse ?
      </label>
      <AddressAutocomplete
        value={address}
        onChange={(value) => updateState({ address: value })}
        onSelect={handleAddressSelect}
        placeholder="123 rue de la République, 75001 Paris"
        disabled={isSearching}
        error={error || undefined}
        autoFocus
        type="housenumber"
        className="w-full"
      />
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Commencez à taper votre adresse et sélectionnez-la dans la liste ou saisissez-la complètement
      </p>
    </div>
  )
}
