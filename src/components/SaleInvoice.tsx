import { useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer } from 'lucide-react';

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

interface SaleInvoiceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InvoiceItem[];
  invoiceNo: string;
  date: string;
  shopName?: string;
}

export function SaleInvoice({ open, onOpenChange, items, invoiceNo, date, shopName }: SaleInvoiceProps) {
  const { t } = useLanguage();
  const printRef = useRef<HTMLDivElement>(null);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Invoice ${invoiceNo}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #ddd; font-size: 13px; }
        th { background: #f5f5f5; font-weight: 600; }
        .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 8px; }
        .header { text-align: center; margin-bottom: 16px; }
        .header h2 { margin: 0; }
        .meta { font-size: 12px; color: #666; margin: 4px 0; }
        .footer { text-align: center; font-size: 11px; color: #999; margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 8px; }
        @media print { body { padding: 0; } }
      </style></head><body>
      ${content.innerHTML}
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t('invoice')}</DialogTitle></DialogHeader>

        <div ref={printRef}>
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">{shopName || 'KidWear Store'}</h2>
            <p className="text-xs text-muted-foreground">{t('invoice')} #{invoiceNo}</p>
            <p className="text-xs text-muted-foreground">{t('date')}: {date}</p>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">{t('product')}</th>
                <th className="text-center py-2">{t('quantity')}</th>
                <th className="text-right py-2">{t('amount')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-muted">
                  <td className="py-2">{item.name}</td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-right py-2">₹{(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-right mt-3 pt-2 border-t-2 border-foreground">
            <span className="text-muted-foreground">{t('amount')}: </span>
            <span className="text-xl font-bold">₹{total.toLocaleString()}</span>
          </div>

          <div className="text-center mt-4 text-xs text-muted-foreground border-t border-dashed pt-2">
            {t('thankYou')}
          </div>
        </div>

        <Button onClick={handlePrint} className="w-full mt-2">
          <Printer className="h-4 w-4 mr-2" />{t('printInvoice')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
