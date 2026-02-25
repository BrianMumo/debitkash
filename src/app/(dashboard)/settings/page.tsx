"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Settings, Shield, Globe, CheckCircle, XCircle } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");

  async function testConnection() {
    setTesting(true);
    setConnectionStatus("idle");

    try {
      // Try to get an OAuth token to validate credentials
      const res = await fetch("/api/mpesa/balance", { method: "POST" });

      if (res.ok) {
        setConnectionStatus("success");
        toast("Connection successful! M-Pesa credentials are valid.", "success");
      } else {
        const data = await res.json();
        setConnectionStatus("error");
        toast(data.error || "Connection failed. Check your credentials.", "error");
      }
    } catch {
      setConnectionStatus("error");
      toast("Connection failed. Check your credentials.", "error");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your M-Pesa integration and application settings
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-emerald-600" />
            <CardTitle>M-Pesa Connection</CardTitle>
          </div>
          <CardDescription>Test your connection to the Safaricom Daraja API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={testConnection} loading={testing}>
              Test Connection
            </Button>
            {connectionStatus === "success" && (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Connected</span>
              </div>
            )}
            {connectionStatus === "error" && (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Connection Failed</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Environment Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-600" />
            <CardTitle>Configuration</CardTitle>
          </div>
          <CardDescription>
            M-Pesa credentials are managed through environment variables for security.
            Update them in your <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env.local</code> file
            or Vercel dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  id="env"
                  label="Environment"
                  value={process.env.NEXT_PUBLIC_APP_URL?.includes("localhost") ? "Sandbox" : "Production"}
                  disabled
                />
              </div>
              <div>
                <Input
                  id="shortcode"
                  label="Shortcode"
                  value="Configured via MPESA_SHORTCODE"
                  disabled
                />
              </div>
              <div>
                <Input
                  id="consumerKey"
                  label="Consumer Key"
                  type="password"
                  value="••••••••••••••••"
                  disabled
                />
              </div>
              <div>
                <Input
                  id="consumerSecret"
                  label="Consumer Secret"
                  type="password"
                  value="••••••••••••••••"
                  disabled
                />
              </div>
              <div>
                <Input
                  id="initiator"
                  label="Initiator Name"
                  value="Configured via MPESA_INITIATOR_NAME"
                  disabled
                />
              </div>
              <div>
                <Input
                  id="certificate"
                  label="Certificate"
                  value="Configured via MPESA_CERTIFICATE_BASE64"
                  disabled
                />
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Security Note:</strong> M-Pesa credentials are stored as environment variables
                and are not exposed to the browser. To update credentials, modify your environment
                variables and redeploy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required Environment Variables */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            <CardTitle>Required Environment Variables</CardTitle>
          </div>
          <CardDescription>
            Ensure all these variables are set in your deployment environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { name: "DATABASE_URL", desc: "PostgreSQL connection string" },
              { name: "AUTH_SECRET", desc: "NextAuth.js secret key" },
              { name: "MPESA_CONSUMER_KEY", desc: "Daraja API consumer key" },
              { name: "MPESA_CONSUMER_SECRET", desc: "Daraja API consumer secret" },
              { name: "MPESA_SHORTCODE", desc: "Your paybill shortcode" },
              { name: "MPESA_INITIATOR_NAME", desc: "API initiator username" },
              { name: "MPESA_INITIATOR_PASSWORD", desc: "API initiator password" },
              { name: "MPESA_CERTIFICATE_BASE64", desc: "Base64-encoded Safaricom certificate" },
              { name: "MPESA_ENVIRONMENT", desc: "sandbox or production" },
              { name: "NEXT_PUBLIC_APP_URL", desc: "Your app URL (for callbacks)" },
            ].map((envVar) => (
              <div key={envVar.name} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <Badge variant="outline" className="font-mono text-xs shrink-0">
                  {envVar.name}
                </Badge>
                <span className="text-sm text-gray-600">{envVar.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
