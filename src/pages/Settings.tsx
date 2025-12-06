import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, CreditCard, Palette, LogOut } from "lucide-react";
import heroSettings from "@/assets/hero-settings.png";

export default function Settings() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="font-display text-display-lg text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground text-lg">Manage your account preferences and settings.</p>
          </div>
          <img 
            src={heroSettings} 
            alt="Settings" 
            className="hidden md:block w-48 h-24 object-cover rounded-lg opacity-80"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar Navigation */}
          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <User className="h-4 w-4" />
              Profile
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Bell className="h-4 w-4" />
              Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Shield className="h-4 w-4" />
              Privacy & Security
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <CreditCard className="h-4 w-4" />
              Billing
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Palette className="h-4 w-4" />
              Appearance
            </Button>
            <Separator className="my-4" />
            <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </nav>

          {/* Settings Content */}
          <div className="space-y-8">
            {/* Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>Update your personal details and public profile.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input id="bio" placeholder="Tell us about yourself..." />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            {/* Notifications Section */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Choose what notifications you want to receive.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates about new prompts and features.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Digest</p>
                    <p className="text-sm text-muted-foreground">Get a weekly summary of trending prompts.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Community Updates</p>
                    <p className="text-sm text-muted-foreground">Notifications about comments and interactions.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            {/* Appearance Section */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize how Querino looks for you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Use dark theme for reduced eye strain.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
