import { Layout } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { User, LogOut, Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 py-2 border-b border-dashed">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium text-right">{user?.firstName} {user?.lastName}</span>
            </div>
            <div className="grid grid-cols-2 py-2 border-b border-dashed">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-right">{user?.email}</span>
            </div>
            <div className="grid grid-cols-2 py-2 border-b border-dashed">
              <span className="text-muted-foreground">Member Since</span>
              <span className="font-medium text-right">2026</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <LogOut className="w-5 h-5" />
              Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Logout from your current session. You will need to log in again to access your data.
            </p>
            <Button 
              variant="destructive" 
              className="w-full sm:w-auto"
              onClick={() => logout()}
            >
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
