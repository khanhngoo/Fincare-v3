"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Link2, CheckCircle2 } from "lucide-react"
import { useState } from "react"

interface Integration {
  id: string
  name: string
  description: string
  logo: string
  connected: boolean
}

export function IntegrationConnect() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "misa",
      name: "MISA",
      description: "Sync financial statements and accounting data automatically",
      logo: "M",
      connected: false,
    },
    {
      id: "fast",
      name: "FAST",
      description: "Import accounting records and tax documents",
      logo: "F",
      connected: false,
    },
    {
      id: "bravo",
      name: "Bravo",
      description: "Connect your business accounting software",
      logo: "B",
      connected: false,
    },
  ])

  const handleConnect = (id: string) => {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id ? { ...integration, connected: !integration.connected } : integration,
      ),
    )
  }

  return (
    <div className="space-y-4">
      {integrations.map((integration) => (
        <Card key={integration.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary">{integration.logo}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    {integration.connected && (
                      <Badge className="bg-primary text-primary-foreground">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{integration.description}</CardDescription>
                </div>
              </div>
              <Button
                variant={integration.connected ? "outline" : "default"}
                size="sm"
                onClick={() => handleConnect(integration.id)}
                className="flex-shrink-0"
              >
                {integration.connected ? (
                  "Disconnect"
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
