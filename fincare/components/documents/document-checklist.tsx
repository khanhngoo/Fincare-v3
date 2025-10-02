"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle } from "lucide-react"

interface DocumentItem {
  id: string
  name: string
  description: string
  status: "pending" | "uploaded" | "verified"
  required: boolean
}

interface DocumentChecklistProps {
  documents: DocumentItem[]
}

export function DocumentChecklist({ documents }: DocumentChecklistProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="h-5 w-5 text-primary" />
      case "uploaded":
        return <CheckCircle2 className="h-5 w-5 text-primary/60" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-primary text-primary-foreground">Verified</Badge>
      case "uploaded":
        return <Badge variant="secondary">Uploaded</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <Card key={doc.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="mt-0.5">{getStatusIcon(doc.status)}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{doc.name}</h4>
                      {doc.required && (
                        <Badge variant="outline" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
