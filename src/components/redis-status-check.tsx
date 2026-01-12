"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function RedisStatusCheck() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkRedisStatus = async () => {
      try {
        const response = await fetch('/api/redis/test');
        const data = await response.json();
        console.log('Redis API response:', data); // Debug log
        setIsConnected(data.connected === true);
      } catch (error) {
        console.error('Redis check error:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkRedisStatus();
  }, []);

  if (isLoading || isConnected === null) {
    return null; // Don't show anything while loading or if status is unknown
  }

  // Ensure isConnected is a boolean to prevent any potential issues
  const connectionStatus = Boolean(isConnected);

  return (
    <div className="mt-3">
      <span
        className={cn(
          "inline-flex items-center px-2 py-1 rounded-[4px] text-[9px] font-bold text-white",
          "bg-gray-600"
        )}
      >
        Redis Disabled
      </span>
    </div>
  );
}
