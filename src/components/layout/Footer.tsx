import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
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
              <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Discover Prompts
              </Link>
              <Link to="/library" className="text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                My Library
              </Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Resources</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/docs" className="text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Documentation
              </Link>
              <a href="https://discord.gg/X3um7vxX8J" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Community Discord
              </a>
              <a href="mailto:support@querino.ai" className="text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Support
              </a>
              <a href="https://github.com/MichaelZelbel/querino" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Source Code
              </a>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Legal</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Cookie Policy
              </Link>
              <Link to="/impressum" className="text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Impressum
              </Link>
              <Link to="/community-guidelines" className="text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Community Guidelines
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
