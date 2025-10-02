import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, CheckCircle2, FileText, TrendingUp, Shield, Zap, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Trusted by 1,000+ Vietnamese SMEs
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-balance leading-tight">
            Find the Perfect Loan for Your Business
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground text-pretty max-w-2xl mx-auto leading-relaxed">
            Match with suitable loan packages, calculate your loan-readiness score, and generate bank-ready
            applications—all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/loan-form">
              <Button size="lg" className="w-full sm:w-auto text-base">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base bg-transparent">
                How It Works
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>No credit check</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>Free to use</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>AI-powered</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">
              Everything You Need to Secure a Loan
            </h2>
            <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
              From loan matching to application generation, we streamline the entire process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Loan-Readiness Score</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Get a proprietary score (0-100) with detailed breakdown across collateral, financials, liquidity, and
                  credit history.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Smart Loan Matching</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Find ranked loan options from multiple banks with estimated approval chances and required documents.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Auto-Generate Applications</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Create bank-ready application packs with prefilled forms and financial summaries in minutes.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">AI-Powered Insights</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Receive detailed analysis with strengths, weaknesses, and actionable recommendations to improve
                  approval odds.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Document Workspace</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Upload files, connect accounting software, or enter data manually—all with real-time validation.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">RAG-Powered Chatbot</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ask questions about your analysis, get personalized advice, and understand complex financial metrics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">
              Get Funded in 4 Simple Steps
            </h2>
            <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
              Our streamlined process makes finding and applying for loans easier than ever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Fill Loan Form",
                description: "Tell us about your business, loan amount, and purpose in just 2 minutes.",
              },
              {
                step: "02",
                title: "View Matches",
                description: "See ranked loan options from multiple banks with approval estimates.",
              },
              {
                step: "03",
                title: "Upload Documents",
                description: "Add required documents via upload, software integration, or manual entry.",
              },
              {
                step: "04",
                title: "Apply & Track",
                description: "Generate application packs and submit directly to banks.",
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="space-y-4">
                  <div className="text-5xl font-bold text-primary/20">{item.step}</div>
                  <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
                {index < 3 && <div className="hidden lg:block absolute top-8 -right-4 w-8 h-0.5 bg-border" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-balance">Ready to Find Your Perfect Loan?</h2>
            <p className="text-lg text-primary-foreground/90 text-pretty leading-relaxed">
              Join thousands of Vietnamese SMEs who have successfully secured funding with FinCare.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/loan-form">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base">
                  Start Your Application
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/sign-in">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
