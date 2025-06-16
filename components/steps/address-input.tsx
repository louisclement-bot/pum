"use client"
import type { SimulatorData } from "../rainwater-simulator"
import AddressInputRefactored from "./address-input-refactored"

type AddressInputProps = {
  data: SimulatorData
  updateData: (data: Partial<SimulatorData>) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number, subStep?: number) => void
}

export default function AddressInput(props: AddressInputProps) {
  return <AddressInputRefactored {...props} />
}
