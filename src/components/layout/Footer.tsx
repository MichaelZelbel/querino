import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Querino" className="h-8 w-8" />
              <span className="text-lg font-bold text-foreground">Querino</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              The AI prompt library for creators, engineers, and innovators.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Product</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Discover Prompts
              </Link>
              <Link to="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                My Library
              </Link>
              <Link to="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Pricing
              </Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Resources</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/docs" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Documentation
              </Link>
              <a href="https://discord.gg/X3um7vxX8J" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Community Discord
              </a>
              <a href="mailto:support@querino.ai" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Support
              </a>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Legal</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Cookie Policy
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Querino. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
