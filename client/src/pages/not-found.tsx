import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { t, isRtl } = useI18n();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-zinc-900 p-4" dir={isRtl ? "rtl" : "ltr"}>
      <Card className="w-full max-w-md mx-4 shadow-xl border-none">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold text-foreground">{t("notFound.title")}</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {t("notFound.message")}
          </p>

          <div className="mt-8">
             <Link href="/">
               <Button className="w-full">{t("notFound.returnHome")}</Button>
             </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
