import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export default function ComingSoon({ page }: { page: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-center h-64">
      <Card>
        <CardContent className="p-8 text-center">
          <Construction className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">{page}</h2>
          <p className="text-muted-foreground mt-2">Coming in Phase 2</p>
        </CardContent>
      </Card>
    </div>
  );
}
