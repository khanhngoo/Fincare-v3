import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

interface ScoreSummaryProps {
  overallScore: number
  categories: {
    name: string
    score: number
    change?: number
  }[]
}

export function ScoreSummary({ overallScore, categories }: ScoreSummaryProps) {
  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "bg-primary text-primary-foreground" }
    if (score >= 60) return { label: "Good", color: "bg-primary/80 text-primary-foreground" }
    if (score >= 40) return { label: "Fair", color: "bg-primary/60 text-primary-foreground" }
    return { label: "Needs Improvement", color: "bg-muted text-muted-foreground" }
  }

  const scoreLabel = getScoreLabel(overallScore)

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Loan-Readiness Score</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-6xl font-bold text-foreground">{overallScore}</span>
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <Badge className={scoreLabel.color}>{scoreLabel.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Your score indicates a strong likelihood of loan approval. Continue reading for detailed insights.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Category Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((category, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">{category.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">{category.score}</span>
                    {category.change !== undefined && (
                      <div
                        className={`flex items-center gap-1 text-xs ${
                          category.change > 0 ? "text-primary" : "text-destructive"
                        }`}
                      >
                        {category.change > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>{Math.abs(category.change)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${category.score}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
