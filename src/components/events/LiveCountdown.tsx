import React, { useState, useEffect } from 'react';
import { getNextOccurrence } from '@/lib/utils';

interface LiveCountdownProps {
  dateStr: string;
  isRecurring?: boolean;
  shortFormat?: boolean;
  className?: string;
}

export const LiveCountdown: React.FC<LiveCountdownProps> = ({
  dateStr,
  isRecurring = false,
  shortFormat = false,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const target = getNextOccurrence(dateStr);
      const diffMs = target.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeLeft('Today! 🎉');
        return;
      }

      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMs <= 24 * 60 * 60 * 1000) {
        // Last 24 hours - show live hours, minutes, seconds timer
        const h = String(diffHours % 24).padStart(2, '0');
        const m = String(diffMins % 60).padStart(2, '0');
        const s = String(diffSecs % 60).padStart(2, '0');
        
        if (shortFormat) {
          setTimeLeft(`${h}:${m}:${s}`);
        } else {
          setTimeLeft(`${h}h ${m}m ${s}s`);
        }
      } else if (diffDays <= 7) {
        // Within 1 week - show days left
        setTimeLeft(`${diffDays} day${diffDays > 1 ? 's' : ''} left`);
      } else if (diffDays < 30) {
        setTimeLeft(`${diffDays} days`);
      } else {
        const months = Math.floor(diffDays / 30);
        setTimeLeft(`${months} month${months > 1 ? 's' : ''}`);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, [dateStr, isRecurring, shortFormat]);

  return <span className={className}>{timeLeft}</span>;
};
