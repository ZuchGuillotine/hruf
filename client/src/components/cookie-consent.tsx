import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem("cookieConsent");
    if (!hasConsented) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "true");
    setShowConsent(false);
  };

  if (!showConsent) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm z-50">
      <Card className="max-w-2xl mx-auto border-[#1b4332]">
        <CardContent className="pt-6">
          <p className="text-sm text-foreground/90">
            We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
            By clicking "Accept", you consent to our use of cookies. Read our{" "}
            <Link href="/privacy">
              <a className="text-[#1b4332] hover:underline">Privacy Policy</a>
            </Link>{" "}
            to learn more about how we use cookies.
          </p>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            className="border-[#1b4332] text-[#1b4332] hover:bg-[#1b4332] hover:text-white"
            onClick={handleAccept}
          >
            Accept
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
