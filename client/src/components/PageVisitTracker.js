import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import UsageApi from '../services/usageApi';

export default function PageVisitTracker() {
  const location = useLocation();

  useEffect(() => {
    UsageApi.trackPageVisit(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
}
