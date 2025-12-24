import { Check, DollarSign, Users, Calendar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function Pricing() {
  return (
    <section id="pricing" className="relative py-20 px-6 overflow-hidden bg-gradient-to-br from-background via-muted/5 to-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.03),transparent_70%)]"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-primary/5 to-primary/10 rounded-full border border-primary/10">
            <DollarSign className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-primary">Transparent Pricing</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            <span className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Simple, Fair Pricing
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              For Everyone
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No hidden fees. No surprises. Just transparent pricing that works for patients and doctors.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* For Patients */}
          <div className="relative p-8 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
            <div className="absolute top-4 right-4">
              <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                <span className="text-xs font-semibold text-primary">For Patients</span>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold">Free</span>
                </div>
                <p className="text-muted-foreground">
                  No platform fees for booking appointments
                </p>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 bg-primary/10 rounded-full">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Free AI Health Assistant</p>
                    <p className="text-sm text-muted-foreground">Get instant answers to your health questions 24/7</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 bg-primary/10 rounded-full">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">No Booking Fees</p>
                    <p className="text-sm text-muted-foreground">Book appointments directly with doctors at their listed prices</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 bg-primary/10 rounded-full">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Secure Payments</p>
                    <p className="text-sm text-muted-foreground">Pay securely through our platform with full refund protection</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 bg-primary/10 rounded-full">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Easy Rescheduling</p>
                    <p className="text-sm text-muted-foreground">Reschedule or cancel appointments with flexible policies</p>
                  </div>
                </li>
              </ul>

              <Link href="/sign-up/select-role" className="w-full">
                <Button className="w-full" size="lg">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>

          {/* For Doctors */}
          <div className="relative p-8 rounded-2xl border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 via-background to-background">
            <div className="absolute top-4 right-4">
              <div className="px-3 py-1 bg-secondary/10 rounded-full border border-secondary/20">
                <span className="text-xs font-semibold text-secondary">For Doctors</span>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold">3%</span>
                  <span className="text-lg text-muted-foreground">commission</span>
                </div>
                <p className="text-muted-foreground">
                  Only pay when you get paid. No monthly fees.
                </p>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 bg-secondary/10 rounded-full">
                    <Check className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium">Low Commission Rate</p>
                    <p className="text-sm text-muted-foreground">Just 3% per completed appointment - one of the lowest in the industry</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 bg-secondary/10 rounded-full">
                    <Check className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium">No Setup Fees</p>
                    <p className="text-sm text-muted-foreground">Start accepting appointments immediately with zero upfront costs</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 bg-secondary/10 rounded-full">
                    <Check className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium">Fast Payouts</p>
                    <p className="text-sm text-muted-foreground">Get paid directly to your bank account with automated payouts</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 bg-secondary/10 rounded-full">
                    <Check className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium">Full Platform Access</p>
                    <p className="text-sm text-muted-foreground">Complete dashboard, analytics, and patient management tools included</p>
                  </div>
                </li>
              </ul>

              <Link href="/sign-up/select-role" className="w-full">
                <Button className="w-full" size="lg" variant="outline">
                  Join as Doctor
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg border border-border">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Transparent Pricing:</span> You only pay for completed appointments. 
              Cancelled or no-show appointments incur no fees.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Pricing;

