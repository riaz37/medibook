import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainIcon, HeartIcon, ShieldIcon, SparklesIcon } from "lucide-react";
import { format } from "date-fns";
import { getCurrentUser } from "@/lib/auth";

async function DentalHealthOverview() {
  const user = await getCurrentUser();

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainIcon className="size-5 text-primary" />
          Your Healthcare Journey
        </CardTitle>
        <CardDescription>Tips and insights to maintain your health</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Member Since */}
          <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-muted/30 rounded-xl border border-primary/20">
            <div className="text-2xl font-bold text-primary mb-1">
              {format(new Date(user?.createdAt || new Date()), "MMM yyyy")}
            </div>
            <div className="text-sm text-muted-foreground">Member Since</div>
          </div>

          {/* Health Tips */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/30 rounded-xl border border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <HeartIcon className="size-5 text-primary" />
                </div>
                <h4 className="font-semibold text-sm">Regular Checkups</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Schedule regular appointments to maintain optimal health
              </p>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-xl border border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ShieldIcon className="size-5 text-primary" />
                </div>
                <h4 className="font-semibold text-sm">Preventive Care</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Early detection and prevention are key to long-term wellness
              </p>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-xl border border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="size-5 text-primary" />
                </div>
                <h4 className="font-semibold text-sm">AI Assistance</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Get instant healthcare guidance with our AI voice assistant
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DentalHealthOverview;
