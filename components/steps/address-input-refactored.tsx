"use client"
import type { SimulatorData } from "../rainwater-simulator"
import AddressSearchContainer from "../address/containers/AddressSearchContainer"

type AddressInputProps = {
  data: SimulatorData
  updateData: (data: Partial<SimulatorData>) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number, subStep?: number) => void
}

export default function AddressInput({ data, updateData, nextStep, prevStep, goToStep }: AddressInputProps) {
  return <AddressSearchContainer data={data} updateData={updateData} nextStep={nextStep} prevStep={prevStep} />
}
