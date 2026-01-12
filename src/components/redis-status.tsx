'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function RedisStatus() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [lastTest, setLastTest] = useState<Date | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/redis/test');
      const data = await response.json();
      
      if (data.success && data.connected) {
        setStatus('connected');
      } else {
        setStatus('error');
      }
      setLastTest(new Date());
    } catch (error) {
      console.error('Redis connection test failed:', error);
      setStatus('error');
      setLastTest(new Date());
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Connection Failed';
      default:
        return 'Connecting...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Redis Status (Disabled)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          <Badge variant="outline" className={getStatusColor()}>
            {status.toUpperCase()}
          </Badge>
        </div>
        
        {lastTest && (
          <p className="text-sm text-gray-600">
            Last tested: {lastTest.toLocaleTimeString()}
          </p>
        )}
        
        <Button 
          onClick={testConnection} 
          disabled={isTesting}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
          {isTesting ? 'Testing...' : 'Test Connection'}
        </Button>
        
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            Redis is disabled. This application is using MySQL only for data storage.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
