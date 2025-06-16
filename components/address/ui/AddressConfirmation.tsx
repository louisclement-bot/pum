import { useAddressSearch } from "@/contexts/AddressSearchContext"

export default function AddressConfirmation() {
  const { state } = useAddressSearch()
  const { processingAddressRef, showMap } = state

  if (!processingAddressRef?.current || !showMap) return null

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
      <p className="font-medium text-blue-800 dark:text-blue-300">
        Adresse utilisée: {processingAddressRef.current.label}
      </p>
    </div>
  )
}
