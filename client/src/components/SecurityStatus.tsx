import { useState, useEffect } from "react";
import { Shield, CheckCircle, AlertTriangle, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SecurityStatusProps {
  jobId: string;
  fileName: string;
}

interface SecurityInfo {
  jobId: string;
  fileName: string;
  isEncrypted: boolean;
  integrityVerified: boolean;
  securityStatus: "encrypted" | "unencrypted";
  lastVerified: string;
  redactionSummary?: string;
  redactedItemsCount?: number;
}

export function SecurityStatus({ jobId, fileName }: SecurityStatusProps) {
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSecurityStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/documents/${jobId}/security-status`);

        if (!response.ok) {
          throw new Error(`Failed to fetch security status: ${response.status}`);
        }

        const data = await response.json();
        setSecurityInfo(data);
        setError(null);
      } catch (err) {
        console.error('Security status fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load security status');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchSecurityStatus();
    }
  }, [jobId]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
            <span className="text-sm text-gray-600">Checking security status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" />
            Security Status Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!securityInfo) {
    return null;
  }

  const getSecurityIcon = () => {
    if (securityInfo.isEncrypted && securityInfo.integrityVerified) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (securityInfo.isEncrypted) {
      return <Lock className="h-4 w-4 text-blue-600" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    }
  };

  const getSecurityBadgeVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (securityInfo.isEncrypted && securityInfo.integrityVerified) {
      return "default"; // Green
    } else if (securityInfo.isEncrypted) {
      return "secondary"; // Blue
    } else {
      return "outline"; // Amber/Warning
    }
  };

  const getSecurityMessage = () => {
    if (securityInfo.isEncrypted && securityInfo.integrityVerified) {
      return "Document is securely encrypted and integrity verified";
    } else if (securityInfo.isEncrypted && !securityInfo.integrityVerified) {
      return "Document is encrypted but integrity verification failed";
    } else if (securityInfo.isEncrypted) {
      return "Document is encrypted";
    } else {
      return "Document is not encrypted";
    }
  };

  return (
    <TooltipProvider>
      <Card className="w-full bg-gradient-to-br from-blue-900 to-indigo-900 border-blue-500/20 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-blue-100">
            <Shield className="h-4 w-4 text-blue-300" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getSecurityIcon()}
              <span className="text-sm font-medium text-blue-100">
                {securityInfo.isEncrypted ? "Encrypted" : "Unencrypted"}
              </span>
            </div>
            <Badge variant="outline" className="bg-blue-500/20 border-blue-400 text-blue-200">
              {securityInfo.securityStatus}
            </Badge>
          </div>

          <div className="text-xs text-blue-200">
            {getSecurityMessage()}
          </div>

          {/* Personal Information Protection Section */}
          <div className="bg-blue-800/30 rounded-lg p-3 border border-blue-500/30">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-200 mb-2">
              <Shield className="h-3 w-3 text-blue-300" />
              Personal Information Protection
            </div>
            <p className="text-xs text-blue-300">
              {securityInfo.redactionSummary || "No personal information detected"}
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-blue-200">
                  {securityInfo.redactedItemsCount || 0}
                </span>
                <span className="text-xs text-blue-300">items redacted</span>
              </div>
              {securityInfo.redactedItemsCount && securityInfo.redactedItemsCount > 0 && (
                <div className="text-xs text-blue-300">
                  <span>• Email addresses: 1</span>
                  <br />
                  <span>• Phone numbers: 0</span>
                  <br />
                  <span>• Names: 0</span>
                </div>
              )}
            </div>
          </div>

          {securityInfo.isEncrypted && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-blue-200">Integrity:</span>
              {securityInfo.integrityVerified ? (
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center gap-1 text-green-400">
                      <CheckCircle className="h-3 w-3" />
                      <span>Verified</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Document content has been verified for integrity</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center gap-1 text-red-400">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Failed</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Document integrity verification failed - content may be corrupted</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}

          <div className="text-xs text-blue-300">
            Last verified: {new Date(securityInfo.lastVerified).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default SecurityStatus;