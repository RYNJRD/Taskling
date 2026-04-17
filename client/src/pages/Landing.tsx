import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/get-started");
  }, [setLocation]);

  return null;
}
