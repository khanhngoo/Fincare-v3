"use client"

import React from "react"
import type { ReactElement } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { ArrowRight, ArrowLeft, Upload, Building2, User } from "lucide-react"
import { clearLoanOptionsCache } from "@/lib/cache-utils"

const INDIVIDUAL_STEPS = [
  { id: "personal", title: "Personal Information", section: "Step 1" },
  { id: "income", title: "Income & Employment", section: "Step 2" },
  { id: "credit", title: "Credit & Debt", section: "Step 3" },
  { id: "loan", title: "Loan & Collateral", section: "Step 4" },
  { id: "extras", title: "Additional Information", section: "Step 5" },
]

export default function LoanFormPage(): ReactElement {
  const router = useRouter()
  const [userType, setUserType] = useState<"business" | "individual" | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    // Individual fields
    fullName: "",
    age: "",
    maritalStatus: "",
    dependents: "",
    monthlyIncome: "",
    employmentType: "",
    employmentDuration: "",
    salaryPaymentMethod: "",
    monthlyDebtPayments: "",
    cicGroup: "",
    creditHistoryMonths: "",
    creditUtilizationPct: "",
    numLatePayments24m: "",
    numNewInquiries6m: "",
    loanType: "",
    loanAmount: "",
    downPayment: "",
    collateralValue: "",
    appraisalDoc: null as File | null,
    additionalInfo: "",
    // Business fields
    loanPurpose: "",
    businessLoanAmount: 50000000,
    annualRevenue: "",
    timeInBusiness: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [baselineScore, setBaselineScore] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (userType === "individual") {
      // Individual flow - use existing localStorage approach for now
      const dataToSave = { ...formData, userType }
      localStorage.setItem("loanFormData", JSON.stringify(dataToSave))
      router.push("/dashboard-individual/loan-options")
      return
    }

    // Business flow - call baseline API
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/loans/calculate-baseline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loanAmount: formData.businessLoanAmount,
          loanPurpose: formData.loanPurpose,
          annualRevenue: formData.annualRevenue,
          timeInBusiness: formData.timeInBusiness,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate baseline score')
      }

      // Store application ID and baseline score
      localStorage.setItem('currentApplicationId', data.application.id)
      setBaselineScore(data.baselineScore)

      // Clear any existing loan options cache since we have a new application
      clearLoanOptionsCache()

      // Redirect to loan options with application ID
      router.push(`/dashboard/loan-options?applicationId=${data.application.id}`)
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  const updateFormData = (field: string, value: string | number | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const canProceed = () => {
    if (userType === "business") {
      return formData.loanPurpose && formData.businessLoanAmount && formData.annualRevenue && formData.timeInBusiness
    }

    const step = INDIVIDUAL_STEPS[currentStep]
    switch (step.id) {
      case "personal":
        return formData.fullName && formData.age && formData.maritalStatus && formData.dependents
      case "income":
        return (
          formData.monthlyIncome &&
          formData.employmentType &&
          formData.employmentDuration &&
          formData.salaryPaymentMethod
        )
      case "credit":
        return (
          formData.monthlyDebtPayments &&
          formData.cicGroup &&
          formData.creditHistoryMonths &&
          formData.creditUtilizationPct &&
          formData.numLatePayments24m &&
          formData.numNewInquiries6m
        )
      case "loan":
        return formData.loanType && formData.loanAmount && formData.downPayment && formData.collateralValue
      default:
        return true
    }
  }

  const handleNext = () => {
    if (userType === "business") {
      handleSubmit()
      return
    }

    if (currentStep < INDIVIDUAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else {
      setUserType(null)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      updateFormData("appraisalDoc", file)
    }
  }

  if (userType === null) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">Apply for a Loan</h1>
            <p className="text-lg text-muted-foreground text-pretty">Choose your application type to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setUserType("individual")}
            >
              <CardHeader className="text-center pb-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Individual</CardTitle>
                <CardDescription>Personal loans for individuals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Personal loans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Vehicle financing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Property loans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Quick approval process</span>
                  </li>
                </ul>
                <Button className="w-full mt-4">
                  Continue as Individual
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setUserType("business")}
            >
              <CardHeader className="text-center pb-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Business</CardTitle>
                <CardDescription>Loans for SMEs and businesses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Working capital loans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Equipment financing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Business expansion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Flexible terms</span>
                  </li>
                </ul>
                <Button className="w-full mt-4">
                  Continue as Business
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (userType === "business") {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">Business Loan Application</h1>
            <p className="text-lg text-muted-foreground text-pretty">Tell us about your business financing needs</p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Help us understand your financing requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="loanPurpose">
                  What is this loan for? <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.loanPurpose} onValueChange={(value) => updateFormData("loanPurpose", value)}>
                  <SelectTrigger id="loanPurpose">
                    <SelectValue placeholder="Select loan purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="working-capital">Working Capital</SelectItem>
                    <SelectItem value="purchase-equipment">Purchase Equipment</SelectItem>
                    <SelectItem value="business-expansion">Business Expansion</SelectItem>
                    <SelectItem value="start-new-business">Start a New Business</SelectItem>
                    <SelectItem value="inventory">Inventory Purchase</SelectItem>
                    <SelectItem value="real-estate">Real Estate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessLoanAmount">
                  How much do you need? <span className="text-destructive">*</span>
                </Label>
                <div className="space-y-4">
                  <Slider
                    id="businessLoanAmount"
                    min={10000000}
                    max={10000000000}
                    step={10000000}
                    value={[formData.businessLoanAmount]}
                    onValueChange={(value) => updateFormData("businessLoanAmount", value[0])}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">10M VND</span>
                    <Input
                      type="number"
                      value={formData.businessLoanAmount}
                      onChange={(e) => updateFormData("businessLoanAmount", Number(e.target.value))}
                      className="w-48 text-center font-semibold"
                    />
                    <span className="text-sm text-muted-foreground">10B VND</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualRevenue">
                  What was your approximate revenue last year? <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.annualRevenue}
                  onValueChange={(value) => updateFormData("annualRevenue", value)}
                >
                  <SelectTrigger id="annualRevenue">
                    <SelectValue placeholder="Select revenue range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-1b">Under 1B VND</SelectItem>
                    <SelectItem value="1b-5b">1B - 5B VND</SelectItem>
                    <SelectItem value="5b-10b">5B - 10B VND</SelectItem>
                    <SelectItem value="over-10b">Over 10B VND</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeInBusiness">
                  How long has your business been operating? <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.timeInBusiness}
                  onValueChange={(value) => updateFormData("timeInBusiness", value)}
                >
                  <SelectTrigger id="timeInBusiness">
                    <SelectValue placeholder="Select business age" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="just-starting">Just Starting</SelectItem>
                    <SelectItem value="less-1-year">{"< 1 Year"}</SelectItem>
                    <SelectItem value="1-3-years">1-3 Years</SelectItem>
                    <SelectItem value="3-plus-years">3+ Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <Button variant="outline" onClick={() => setUserType(null)} className="bg-transparent" disabled={isSubmitting}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={!canProceed() || isSubmitting}>
              {isSubmitting ? 'Calculating Score...' : 'Submit Application'}
              {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Individual form (5 steps) - existing code
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">Individual Loan Application</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Complete all steps to submit your loan application
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {INDIVIDUAL_STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      index <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`text-xs font-medium text-center ${
                      index <= currentStep ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.section}
                  </span>
                </div>
                {index < INDIVIDUAL_STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      index < currentStep ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Step {currentStep + 1} of {INDIVIDUAL_STEPS.length}
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{INDIVIDUAL_STEPS[currentStep].title}</CardTitle>
            <CardDescription>{INDIVIDUAL_STEPS[currentStep].section}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => updateFormData("fullName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">
                    Age <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter your age"
                    value={formData.age}
                    onChange={(e) => updateFormData("age", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">
                    Marital Status <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.maritalStatus}
                    onValueChange={(value) => updateFormData("maritalStatus", value)}
                  >
                    <SelectTrigger id="maritalStatus">
                      <SelectValue placeholder="Select marital status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dependents">
                    Number of Dependents <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dependents"
                    type="number"
                    placeholder="Enter number of dependents"
                    value={formData.dependents}
                    onChange={(e) => updateFormData("dependents", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Income & Employment */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyIncome">
                    Monthly Income (VND) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="monthlyIncome"
                    type="number"
                    placeholder="Enter your monthly income"
                    value={formData.monthlyIncome}
                    onChange={(e) => updateFormData("monthlyIncome", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employmentType">
                    Employment Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(value) => updateFormData("employmentType", value)}
                  >
                    <SelectTrigger id="employmentType">
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time Employee</SelectItem>
                      <SelectItem value="part-time">Part-time Employee</SelectItem>
                      <SelectItem value="self-employed">Self-employed</SelectItem>
                      <SelectItem value="contract">Contract Worker</SelectItem>
                      <SelectItem value="business-owner">Business Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employmentDuration">
                    Employment Duration (months) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="employmentDuration"
                    type="number"
                    placeholder="Enter duration in months"
                    value={formData.employmentDuration}
                    onChange={(e) => updateFormData("employmentDuration", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Salary Payment Method <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup
                    value={formData.salaryPaymentMethod}
                    onValueChange={(value) => updateFormData("salaryPaymentMethod", value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bank-transfer" id="bank-transfer" />
                      <Label htmlFor="bank-transfer" className="font-normal cursor-pointer">
                        Bank Transfer
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="font-normal cursor-pointer">
                        Cash
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="check" id="check" />
                      <Label htmlFor="check" className="font-normal cursor-pointer">
                        Check
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 3: Credit & Debt */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyDebtPayments">
                    Monthly Debt Payments (VND) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="monthlyDebtPayments"
                    type="number"
                    placeholder="Enter monthly debt payments"
                    value={formData.monthlyDebtPayments}
                    onChange={(e) => updateFormData("monthlyDebtPayments", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cicGroup">
                    CIC Group <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.cicGroup} onValueChange={(value) => updateFormData("cicGroup", value)}>
                    <SelectTrigger id="cicGroup">
                      <SelectValue placeholder="Select CIC group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Group 1 (Excellent)</SelectItem>
                      <SelectItem value="2">Group 2 (Good)</SelectItem>
                      <SelectItem value="3">Group 3 (Fair)</SelectItem>
                      <SelectItem value="4">Group 4 (Poor)</SelectItem>
                      <SelectItem value="5">Group 5 (Bad)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creditHistoryMonths">
                    Credit History (months) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="creditHistoryMonths"
                    type="number"
                    placeholder="Enter credit history in months"
                    value={formData.creditHistoryMonths}
                    onChange={(e) => updateFormData("creditHistoryMonths", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creditUtilizationPct">
                    Credit Utilization (%) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="creditUtilizationPct"
                    type="number"
                    placeholder="Enter credit utilization percentage"
                    value={formData.creditUtilizationPct}
                    onChange={(e) => updateFormData("creditUtilizationPct", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numLatePayments24m">
                    Late Payments (Last 24 months) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="numLatePayments24m"
                    type="number"
                    placeholder="Enter number of late payments"
                    value={formData.numLatePayments24m}
                    onChange={(e) => updateFormData("numLatePayments24m", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numNewInquiries6m">
                    New Credit Inquiries (Last 6 months) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="numNewInquiries6m"
                    type="number"
                    placeholder="Enter number of new inquiries"
                    value={formData.numNewInquiries6m}
                    onChange={(e) => updateFormData("numNewInquiries6m", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Loan & Collateral */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Loan Type <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup value={formData.loanType} onValueChange={(value) => updateFormData("loanType", value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vehicle" id="vehicle" />
                      <Label htmlFor="vehicle" className="font-normal cursor-pointer">
                        Vehicle Loan
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="property" id="property" />
                      <Label htmlFor="property" className="font-normal cursor-pointer">
                        Property Loan
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="personal" id="personal" />
                      <Label htmlFor="personal" className="font-normal cursor-pointer">
                        Personal Loan
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loanAmount">
                    Loan Amount (VND) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="loanAmount"
                    type="number"
                    placeholder="Enter loan amount"
                    value={formData.loanAmount}
                    onChange={(e) => updateFormData("loanAmount", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="downPayment">
                    Down Payment (VND) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="downPayment"
                    type="number"
                    placeholder="Enter down payment"
                    value={formData.downPayment}
                    onChange={(e) => updateFormData("downPayment", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collateralValue">
                    {formData.loanType === "vehicle" ? "Vehicle Value" : "Property Value"} (VND){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="collateralValue"
                    type="number"
                    placeholder={`Enter ${formData.loanType === "vehicle" ? "vehicle" : "property"} value`}
                    value={formData.collateralValue}
                    onChange={(e) => updateFormData("collateralValue", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appraisalDoc">Upload Appraisal Document (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="appraisalDoc"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("appraisalDoc")?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {formData.appraisalDoc ? formData.appraisalDoc.name : "Choose File"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Additional Information */}
            {currentStep === 4 && (
              <div className="space-y-2">
                <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                <Textarea
                  id="additionalInfo"
                  placeholder="Tell us more about your loan needs, timeline, or any specific requirements..."
                  rows={6}
                  value={formData.additionalInfo}
                  onChange={(e) => updateFormData("additionalInfo", e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={handleBack} className="bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!canProceed()}>
            {currentStep === INDIVIDUAL_STEPS.length - 1 ? "Submit Application" : "Continue"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
