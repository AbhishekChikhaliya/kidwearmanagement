import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProductImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
}

export function ProductImageUpload({ imageUrl, onImageChange }: ProductImageUploadProps) {
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('invalidImage'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('imageTooLarge'));
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `products/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file);
      if (error) throw error;

      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      onImageChange(data.publicUrl);
      toast.success(t('imageUploaded'));
    } catch (err: any) {
      toast.error(err.message || t('uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onImageChange(null);
  };

  return (
    <div className="space-y-2">
      {imageUrl ? (
        <div className="relative w-24 h-24">
          <img src={imageUrl} alt="Product" className="w-24 h-24 rounded-lg object-cover border" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
      {!imageUrl && !uploading && (
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Camera className="h-3 w-3 mr-1" />{t('uploadImage')}
        </Button>
      )}
    </div>
  );
}
