export async function searchAddressByText(
  address: string,
  options?: {
    coordinates?: [number, number]
    banId?: string
    city?: string
    postcode?: string
    citycode?: string
    useExactAddress?: boolean
  },
) {
  // Prepare the request data
  const requestData: any = {
    address,
  }

  // Include additional options if provided
  if (options) {
    Object.assign(requestData, options)
  }

  console.log("Searching for address:", {
    address,
    hasCoordinates: !!options?.coordinates,
    banId: options?.banId,
  })

  // Call the API endpoint
  const response = await fetch("/api/roof-surface", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Erreur lors de la recherche de l'adresse")
  }

  return await response.json()
}

export async function selectBuilding(
  address: string,
  buildingId: string,
  options?: {
    coordinates?: [number, number]
    banId?: string
    city?: string
    postcode?: string
    citycode?: string
    useExactAddress?: boolean
  },
) {
  const requestData: any = {
    address,
    buildingId,
  }

  // Include additional options if provided
  if (options) {
    Object.assign(requestData, options)
  }

  const response = await fetch("/api/roof-surface", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Erreur lors de la sélection du bâtiment")
  }

  return await response.json()
}
