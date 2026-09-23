import { Link } from "@/lib/router-compat";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { openConsentSettings } from "@/lib/consent";

const Cookies = () => {
  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Table of Contents Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="lg:sticky lg:top-32">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Table of Contents
                </h2>
                <nav className="space-y-2 text-sm">
                  <button
                    onClick={() => scrollToSection("interpretation")}
                    className="block text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    Interpretation and Definitions
                  </button>
                  <button
                    onClick={() => scrollToSection("use")}
                    className="block text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    The Use of Cookies
                  </button>
                  <button
                    onClick={() => scrollToSection("choices")}
                    className="block text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    Your Choices Regarding Cookies
                  </button>
                  <button
                    onClick={() => scrollToSection("more")}
                    className="block text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    More Information
                  </button>
                  <button
                    onClick={() => scrollToSection("contact")}
                    className="block text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    Contact Us
                  </button>
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 max-w-3xl">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-2">
                    Cookies Policy
                  </h1>
                  <p className="text-muted-foreground">
                    <strong>Last updated:</strong> September 22, 2026
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="flex items-center gap-2 print:hidden"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save PDF
                </Button>
              </div>

              <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
                <p>
                  This Cookies Policy explains what Cookies are and how We use
                  them. You should read this policy so You can understand what
                  type of cookies We use, or the information We collect using
                  Cookies and how that information is used.
                </p>
                <p>
                  Cookies do not typically contain any information that
                  personally identifies a user, but personal information that we
                  store about You may be linked to the information stored in and
                  obtained from Cookies. For further information on how We use,
                  store and keep your personal data secure, see our{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
                <p>
                  We do not store sensitive personal information, such as
                  mailing addresses, account passwords, etc. in the Cookies We
                  use.
                </p>

                <section id="interpretation">
                  <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">
                    Interpretation and Definitions
                  </h2>

                  <h3 className="text-xl font-medium text-foreground mt-6 mb-3">
                    Interpretation
                  </h3>
                  <p>
                    The words of which the initial letter is capitalized have
                    meanings defined under the following conditions. The
                    following definitions shall have the same meaning regardless
                    of whether they appear in singular or in plural.
                  </p>

                  <h3 className="text-xl font-medium text-foreground mt-6 mb-3">
                    Definitions
                  </h3>
                  <p>For the purposes of this Cookies Policy:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>
                      <strong className="text-foreground">Company</strong>{" "}
                      (referred to as either "the Company", "We", "Us" or "Our"
                      in this Cookies Policy) refers to Zelbel Ltd., 69 Great
                      Hampton Street Birmingham, B18 6EW United Kingdom.
                    </li>
                    <li>
                      <strong className="text-foreground">Cookies</strong> means
                      small files that are placed on Your computer, mobile
                      device or any other device by a website, containing
                      details of your browsing history on that website among its
                      many uses.
                    </li>
                    <li>
                      <strong className="text-foreground">Website</strong>{" "}
                      refers to Querino, accessible from https://querino.ai
                    </li>
                    <li>
                      <strong className="text-foreground">You</strong> means the
                      individual accessing or using the Website, or a company,
                      or any legal entity on behalf of which such individual is
                      accessing or using the Website, as applicable.
                    </li>
                  </ul>
                </section>

                <section id="use">
                  <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">
                    The Use of Cookies
                  </h2>
                  <p>
                    The list below is complete: it names every Cookie the
                    Website sets, with its real lifetime. Only one of them is
                    optional, and it is only set after You choose "Accept all"
                    in the cookie banner.
                  </p>

                  <h3 className="text-xl font-medium text-foreground mt-6 mb-3">
                    Strictly necessary (set without asking)
                  </h3>
                  <p>
                    These are needed to deliver the Website and keep it secure.
                    They are set without consent, as § 25 (2) TDDDG allows.
                  </p>
                  <ul className="list-disc pl-6 space-y-4 mt-4">
                    <li>
                      <strong className="text-foreground">__cf_bm</strong>
                      <br />
                      Set by: Cloudflare, for our host
                      <br />
                      Purpose: tells real visitors apart from automated bots
                      <br />
                      Lifetime: 30 minutes
                    </li>
                    <li>
                      <strong className="text-foreground">__dpl</strong>
                      <br />
                      Set by: Lovable, our host
                      <br />
                      Purpose: serves every page from the same version of the
                      Website
                      <br />
                      Lifetime: 24 hours
                    </li>
                  </ul>

                  <h3 className="text-xl font-medium text-foreground mt-6 mb-3">
                    Statistics (only with Your consent)
                  </h3>
                  <ul className="list-disc pl-6 space-y-4 mt-4">
                    <li>
                      <strong className="text-foreground">session-id</strong>
                      <br />
                      Set by: Lovable, our host, for its visitor statistics
                      <br />
                      Purpose: counts page views and groups the pages of one
                      visit, so We know which pages people read. It does not
                      follow You to other websites and is not used for
                      advertising.
                      <br />
                      Lifetime: 30 minutes
                    </li>
                  </ul>
                  <p className="mt-4">
                    Until You choose "Accept all", this Cookie is not written
                    and no statistics are sent. "Just the essentials" deletes it
                    at once if it was set earlier.
                  </p>

                  <h3 className="text-xl font-medium text-foreground mt-6 mb-3">
                    Local storage
                  </h3>
                  <p>
                    The Website also uses Your browser's local storage, which
                    works like a Cookie but is never sent to a server by itself.
                    It holds only what the Website needs to work or what You
                    chose Yourself: Your cookie choice (querino-consent), Your
                    sign-in session if You sign in, Your light or dark theme,
                    the workspace You last opened, the AI app You prefer to open
                    prompts in, and unsent drafts in the AI coach. None of it is
                    used for statistics or advertising.
                  </p>
                </section>

                <section id="choices">
                  <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">
                    Your Choices Regarding Cookies
                  </h2>
                  <p>
                    When You first visit, the cookie banner offers two equal
                    choices: "Accept all" allows the statistics Cookie, "Just
                    the essentials" keeps only the strictly necessary ones. You
                    can change or withdraw Your choice at any time with the
                    "Cookie settings" link in the footer of every page, which
                    opens the banner again.
                  </p>
                  <p className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openConsentSettings}
                      className="print:hidden"
                    >
                      Cookie settings
                    </Button>
                  </p>
                  <p className="mt-4">
                    You can also delete Cookies or tell Your web browser to
                    refuse them. The strictly necessary ones are then set again
                    on Your next visit, because the Website cannot be delivered
                    without them. Your browser's help pages explain how:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>
                      For the{" "}
                      <strong className="text-foreground">Chrome</strong> web
                      browser, please visit this page from Google:{" "}
                      <a
                        href="https://support.google.com/accounts/answer/32050"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Google Chrome help
                      </a>
                    </li>
                    <li>
                      For the{" "}
                      <strong className="text-foreground">Firefox</strong> web
                      browser, please visit this page from Mozilla:{" "}
                      <a
                        href="https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Firefox help
                      </a>
                    </li>
                    <li>
                      For the{" "}
                      <strong className="text-foreground">Safari</strong> web
                      browser, please visit this page from Apple:{" "}
                      <a
                        href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Safari help
                      </a>
                    </li>
                    <li>
                      For any other web browser, please visit your web browser's
                      official web pages.
                    </li>
                  </ul>
                </section>

                <section id="more">
                  <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">
                    More Information about Cookies
                  </h2>
                  <p>
                    You can learn more about cookies:{" "}
                    <a
                      href="https://www.allaboutcookies.org/what-are-cookies/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      What Are Cookies?
                    </a>
                  </p>
                </section>

                <section id="contact">
                  <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">
                    Contact Us
                  </h2>
                  <p>
                    If you have any questions about this Cookies Policy, You can
                    contact us:
                  </p>
                  <ul className="list-disc pl-6 mt-2">
                    <li>
                      By email:{" "}
                      <a
                        href="mailto:support@querino.ai"
                        className="text-primary hover:underline"
                      >
                        support@querino.ai
                      </a>
                    </li>
                  </ul>
                </section>

                <div className="mt-10 pt-6 border-t border-border">
                  <p className="text-sm">
                    See also:{" "}
                    <Link
                      to="/privacy"
                      className="text-primary hover:underline"
                    >
                      Privacy Policy
                    </Link>{" "}
                    |{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cookies;
