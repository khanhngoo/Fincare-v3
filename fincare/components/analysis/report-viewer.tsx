import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, TrendingUp } from "lucide-react"

export function ReportViewer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Generated Analysis Report</CardTitle>
        <CardDescription>Comprehensive insights and recommendations for your loan application</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Executive Summary */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            Executive Summary
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Your business demonstrates strong financial health with consistent revenue growth and healthy liquidity
            ratios. The collateral provided is sufficient for the requested loan amount. Your loan-readiness score of
            85/100 indicates excellent approval prospects across multiple lending institutions.
          </p>
        </div>

        {/* Strengths */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            Key Strengths
          </h3>
          <ul className="space-y-2">
            {[
              "Strong revenue growth of 35% year-over-year",
              "Healthy debt-to-equity ratio of 0.45",
              "Excellent payment history with no defaults",
              "Sufficient collateral coverage at 150% of loan amount",
              "Positive cash flow for the past 18 months",
            ].map((strength, index) => (
              <li key={index} className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-primary text-primary-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                </Badge>
                <span className="text-muted-foreground">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-primary" />
            </div>
            Areas for Improvement
          </h3>
          <ul className="space-y-2">
            {[
              {
                issue: "Current ratio could be improved",
                recommendation: "Increase working capital by 15% to strengthen liquidity position",
                impact: "+5 points",
              },
              {
                issue: "Limited credit history with banks",
                recommendation: "Establish relationships with 2-3 additional financial institutions",
                impact: "+3 points",
              },
            ].map((item, index) => (
              <li key={index} className="space-y-1">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">
                    <AlertCircle className="h-3 w-3" />
                  </Badge>
                  <div className="flex-1">
                    <p className="text-muted-foreground">{item.issue}</p>
                    <p className="text-sm text-muted-foreground/80 mt-1">
                      <span className="font-medium">Recommendation:</span> {item.recommendation}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      Expected Impact: {item.impact}
                    </Badge>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Loan Suitability */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Loan Product Suitability</h3>
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-foreground">Vietcombank SME Business Loan</h4>
                <Badge className="bg-primary text-primary-foreground">Best Match</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Highly suitable based on your financial profile. Competitive rates and flexible terms align well with
                your business needs.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-foreground">BIDV Working Capital Loan</h4>
                <Badge variant="secondary">Good Match</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Suitable for short-term financing needs. Consider if you need faster disbursement with slightly higher
                rates.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
