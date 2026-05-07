import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileImage, Check, Loader2, Edit, Trash2, FileScan } from 'lucide-react';
import { toast } from 'sonner';

interface ExtractedItem {
  name: string;
  quantity: number;
  wholesale_price: number;
  retail_price: number;
  size: string;
  color: string;
  brand: string;
  category_guess: string;
  matched_category_id: string | null;
}

interface ExtractedData {
  supplier: {
    name: string;
    gst_number: string;
    phone: string;
    address: string;
    matched_id: string | null;
  };
  bill_date: string;
  bill_number: string;
  items: ExtractedItem[];
  total_amount: number;
  notes: string;
}

export default function BillUpload() {
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<ExtractedItem | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error(t('uploadBillImage'));
      return;
    }

    setUploading(true);
    setExtracted(null);

    // Create preview
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    }

    try {
      // Upload to storage
      const ext = file.name.split('.').pop();
      const path = `bills/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('supplier-bills')
        .upload(path, file);

      if (uploadErr) throw uploadErr;

      // Get signed URL for AI processing
      const { data: urlData } = await supabase.storage
        .from('supplier-bills')
        .createSignedUrl(path, 600); // 10 min

      if (!urlData?.signedUrl) throw new Error('Failed to get signed URL');

      setUploading(false);
      setExtracting(true);

      // Call edge function
      const { data: session } = await supabase.auth.getSession();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/extract-bill`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session?.access_token}`,
          },
          body: JSON.stringify({ imageUrl: urlData.signedUrl }),
        }
      );

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Extraction failed');
      }

      setExtracted(result.data);
      toast.success(t('billExtracted'));
    } catch (err: any) {
      toast.error(err.message || t('extractionFailed'));
    } finally {
      setUploading(false);
      setExtracting(false);
    }
  };

  const handleEditItem = (idx: number) => {
    if (!extracted) return;
    setEditIdx(idx);
    setEditItem({ ...extracted.items[idx] });
  };

  const handleSaveEdit = () => {
    if (!extracted || editIdx === null || !editItem) return;
    const items = [...extracted.items];
    items[editIdx] = editItem;
    setExtracted({ ...extracted, items });
    setEditIdx(null);
    setEditItem(null);
  };

  const handleRemoveItem = (idx: number) => {
    if (!extracted) return;
    const items = extracted.items.filter((_, i) => i !== idx);
    setExtracted({ ...extracted, items });
  };

  const handleConfirmAndSave = async () => {
    if (!extracted || extracted.items.length === 0) return;
    setSaving(true);

    try {
      // 1. Ensure supplier exists
      let supplierId = extracted.supplier.matched_id;
      if (!supplierId) {
        const { data: newSupplier, error: supErr } = await supabase
          .from('suppliers')
          .insert({
            name: extracted.supplier.name,
            gst_number: extracted.supplier.gst_number || null,
            phone: extracted.supplier.phone || null,
            address: extracted.supplier.address || null,
          })
          .select('id')
          .single();

        if (supErr) throw supErr;
        supplierId = newSupplier.id;
      }

      // 2. Insert products and update stock
      for (const item of extracted.items) {
        // Check if product with same name exists
        const { data: existing } = await supabase
          .from('products')
          .select('id, stock_quantity')
          .ilike('name', item.name)
          .limit(1);

        if (existing && existing.length > 0) {
          // Update existing product stock
          const prod = existing[0];
          await supabase.from('products').update({
            stock_quantity: prod.stock_quantity + item.quantity,
            wholesale_price: item.wholesale_price,
            ...(item.retail_price > 0 ? { retail_price: item.retail_price } : {}),
          }).eq('id', prod.id);

          // Log inventory
          await supabase.from('inventory_logs').insert({
            product_id: prod.id,
            type: 'added' as const,
            quantity: item.quantity,
            notes: `From bill ${extracted.bill_number || ''} - ${extracted.supplier.name}`,
          });
        } else {
          // Create new product
          const { data: newProd, error: prodErr } = await supabase
            .from('products')
            .insert({
              name: item.name,
              stock_quantity: item.quantity,
              wholesale_price: item.wholesale_price,
              retail_price: item.retail_price || 0,
              size: item.size || null,
              color: item.color || null,
              brand: item.brand || null,
              supplier_id: supplierId,
              category_id: item.matched_category_id || null,
            })
            .select('id')
            .single();

          if (prodErr) throw prodErr;

          // Log inventory
          await supabase.from('inventory_logs').insert({
            product_id: newProd.id,
            type: 'added' as const,
            quantity: item.quantity,
            notes: `New from bill ${extracted.bill_number || ''} - ${extracted.supplier.name}`,
          });
        }
      }

      // 3. Create purchase order record
      // Get first product for the PO (or create multiple)
      for (const item of extracted.items) {
        const { data: prod } = await supabase
          .from('products')
          .select('id')
          .ilike('name', item.name)
          .limit(1)
          .single();

        if (prod) {
          await supabase.from('purchase_orders').insert({
            supplier_id: supplierId,
            product_id: prod.id,
            quantity: item.quantity,
            order_date: extracted.bill_date || new Date().toISOString().split('T')[0],
            status: 'received' as const,
          });
        }
      }

      toast.success(t('billSaved'));
      setExtracted(null);
      setPreviewUrl(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err: any) {
      toast.error(err.message || t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={t('billUpload')} subtitle="Scan supplier bills with AI" emoji="🧾" icon={<FileScan className="h-6 w-6" />} />

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {uploading || extracting ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-muted-foreground">
                  {uploading ? t('uploadingBill') : t('extractingDetails')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">{t('dropOrClickBill')}</p>
                <p className="text-xs text-muted-foreground">{t('supportedFormats')}</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading || extracting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview + Extracted Data */}
      {(previewUrl || extracted) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bill Preview */}
          {previewUrl && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileImage className="h-5 w-5" />{t('billPreview')}</CardTitle></CardHeader>
              <CardContent>
                <img src={previewUrl} alt="Bill" className="w-full rounded-lg border" />
              </CardContent>
            </Card>
          )}

          {/* Extracted Info */}
          {extracted && (
            <Card>
              <CardHeader><CardTitle>{t('extractedDetails')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Supplier Info */}
                <div className="p-3 rounded-lg bg-muted space-y-1">
                  <p className="font-semibold text-foreground">{extracted.supplier.name}</p>
                  {extracted.supplier.gst_number && <p className="text-sm text-muted-foreground">GST: {extracted.supplier.gst_number}</p>}
                  {extracted.supplier.phone && <p className="text-sm text-muted-foreground">{t('phone')}: {extracted.supplier.phone}</p>}
                  {extracted.bill_number && <p className="text-sm text-muted-foreground">{t('billNo')}: {extracted.bill_number}</p>}
                  {extracted.bill_date && <p className="text-sm text-muted-foreground">{t('date')}: {extracted.bill_date}</p>}
                  {extracted.supplier.matched_id ? (
                    <Badge variant="default">{t('existingSupplier')}</Badge>
                  ) : (
                    <Badge variant="secondary">{t('newSupplier')}</Badge>
                  )}
                </div>

                {/* Items */}
                <div className="text-sm font-medium text-foreground">{t('items')} ({extracted.items.length})</div>
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('product')}</TableHead>
                        <TableHead>{t('quantity')}</TableHead>
                        <TableHead>{t('wholesalePrice')}</TableHead>
                        <TableHead>{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extracted.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <div className="text-xs text-muted-foreground">
                                {[item.size, item.color, item.brand].filter(Boolean).join(' · ')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.wholesale_price}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditItem(idx)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {extracted.total_amount > 0 && (
                  <div className="p-3 rounded-lg bg-muted text-right">
                    <span className="text-muted-foreground">{t('amount')}: </span>
                    <span className="font-bold text-lg text-foreground">₹{extracted.total_amount.toLocaleString()}</span>
                  </div>
                )}

                <Button onClick={handleConfirmAndSave} disabled={saving} className="w-full" size="lg">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  {saving ? t('saving') : t('confirmAndAddStock')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit Item Dialog */}
      <Dialog open={editIdx !== null} onOpenChange={() => { setEditIdx(null); setEditItem(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('editProduct')}</DialogTitle></DialogHeader>
          {editItem && (
            <div className="grid gap-3 py-2">
              <div><Label>{t('name')}</Label><Input value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t('quantity')}</Label><Input type="number" min={1} value={editItem.quantity} onChange={e => setEditItem({ ...editItem, quantity: +e.target.value })} /></div>
                <div><Label>{t('wholesalePrice')}</Label><Input type="number" min={0} value={editItem.wholesale_price} onChange={e => setEditItem({ ...editItem, wholesale_price: +e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t('retailPrice')}</Label><Input type="number" min={0} value={editItem.retail_price} onChange={e => setEditItem({ ...editItem, retail_price: +e.target.value })} /></div>
                <div><Label>{t('size')}</Label><Input value={editItem.size || ''} onChange={e => setEditItem({ ...editItem, size: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t('color')}</Label><Input value={editItem.color || ''} onChange={e => setEditItem({ ...editItem, color: e.target.value })} /></div>
                <div><Label>{t('brand')}</Label><Input value={editItem.brand || ''} onChange={e => setEditItem({ ...editItem, brand: e.target.value })} /></div>
              </div>
              <Button onClick={handleSaveEdit} className="w-full">{t('update')}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
