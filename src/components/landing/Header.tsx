"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 right-0 left-0 z-50 px-6 py-3 border-b transition-all duration-300 ${
        scrolled
          ? "border-border/80 bg-background/95 backdrop-blur-lg shadow-sm"
          : "border-border/50 bg-background/80 backdrop-blur-md"
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center h-14">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src={"/logo.png"}
            alt="Medibook Logo"
            width={32}
            height={32}
            className="w-8 h-8 group-hover:scale-110 transition-transform duration-300"
          />
          <span className="font-semibold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Medibook
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            How it Works
          </button>
          <button
            onClick={() => scrollToSection("pricing")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </button>
          <button
            onClick={() => scrollToSection("features")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </button>
        </div>

        <div className="flex items-center gap-3">
          <AnimatedThemeToggler className="h-9 w-9" />
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              Login
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              Get Started
            </Button>
          </SignUpButton>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-lg">
          <div className="px-6 py-4 space-y-3">
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="block w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              How it Works
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="block w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="block w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Features
            </button>
            <div className="pt-3 border-t border-border/50 flex flex-col gap-2">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  Login
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                  Get Started
                </Button>
              </SignUpButton>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
export default Header;
