import { Link } from "react-router-dom";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const Impressum = () => {
  const handlePrint = () => {
    window.print();
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
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Impressum</h1>
              <p className="text-muted-foreground">
                <strong>Legal Notice</strong>
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

          <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Information according to § 5 TMG</h2>
              
              <div className="space-y-1">
                <p className="text-foreground font-medium">Zelbel Ltd.</p>
                <p>69 Great Hampton Street</p>
                <p>Birmingham, B18 6EW</p>
                <p>United Kingdom</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Contact</h2>
              <div className="space-y-1">
                <p>Email: <a href="mailto:support@querino.ai" className="text-primary hover:underline">support@querino.ai</a></p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Represented by</h2>
              <p>The Directors of Zelbel Ltd.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Company Registration</h2>
              <div className="space-y-1">
                <p>Registered in England and Wales</p>
                <p>Companies House, United Kingdom</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Responsible for content according to § 55 Abs. 2 RStV</h2>
              <div className="space-y-1">
                <p className="text-foreground font-medium">Zelbel Ltd.</p>
                <p>69 Great Hampton Street</p>
                <p>Birmingham, B18 6EW</p>
                <p>United Kingdom</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">EU Dispute Resolution</h2>
              <p>
                The European Commission provides a platform for online dispute resolution (ODR):{" "}
                <a 
                  href="https://ec.europa.eu/consumers/odr/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p className="mt-2">
                We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Liability for Content</h2>
              <p>
                As a service provider, we are responsible for our own content on these pages in accordance with general laws pursuant to § 7 Abs.1 TMG. According to §§ 8 to 10 TMG, however, we are not obligated as a service provider to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.
              </p>
              <p className="mt-2">
                Obligations to remove or block the use of information under general law remain unaffected. However, liability in this regard is only possible from the time of knowledge of a specific infringement. Upon becoming aware of corresponding infringements, we will remove this content immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Liability for Links</h2>
              <p>
                Our offer contains links to external websites of third parties, on whose contents we have no influence. Therefore, we cannot assume any liability for these external contents. The respective provider or operator of the pages is always responsible for the contents of the linked pages. The linked pages were checked for possible legal violations at the time of linking. Illegal contents were not recognizable at the time of linking.
              </p>
              <p className="mt-2">
                However, a permanent control of the contents of the linked pages is not reasonable without concrete evidence of a violation of the law. Upon becoming aware of legal violations, we will remove such links immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Copyright</h2>
              <p>
                The content and works created by the site operators on these pages are subject to copyright law. Duplication, processing, distribution, or any form of commercialization of such material beyond the scope of copyright law requires the prior written consent of its respective author or creator. Downloads and copies of this site are only permitted for private, non-commercial use.
              </p>
              <p className="mt-2">
                Insofar as the content on this site was not created by the operator, the copyrights of third parties are respected. In particular, third-party content is marked as such. Should you nevertheless become aware of a copyright infringement, please inform us accordingly. Upon becoming aware of legal violations, we will remove such content immediately.
              </p>
            </section>

            <div className="mt-10 pt-6 border-t border-border">
              <p className="text-sm">
                See also: <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> | <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> | <Link to="/cookies" className="text-primary hover:underline">Cookie Policy</Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Impressum;
