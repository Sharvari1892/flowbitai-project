'use client';

import { useEffect, useState } from 'react';
import { vannaAPI, HealthResponse } from '@/lib/api/vanna';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export default function VannaStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHealth();
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const response = await vannaAPI.checkHealth();
      setHealth(response);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking...
      </Badge>
    );
  }

  if (!health) {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <XCircle className="h-3 w-3" />
        AI Offline
      </Badge>
    );
  }

  const isHealthy = health.status === 'healthy' && 
                    health.database === 'connected' && 
                    health.vanna === 'initialized';

  if (isHealthy) {
    return (
      <Badge variant="default" className="gap-1.5 bg-green-600 hover:bg-green-700">
        <CheckCircle2 className="h-3 w-3" />
        AI Ready
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1.5">
      <AlertCircle className="h-3 w-3" />
      Initializing
    </Badge>
  );
}