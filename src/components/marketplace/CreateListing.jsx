import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CAT_CONFIG } from './ItemCard';
import { Loader2, X, Tag, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

const CONDITIONS = [
  { value: 'new', label: '✨ New' },
  { value: 'like_new', label: '🌟 Like New' },
  { value: 'good', label: '👍 Good' },
  { value: 'fair', label: '📦 Fair' },
];

export default function CreateListing({ open, onClose, user, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', price: '', category: 'textbook', condition: 'good', subject: '', grade_level: '', is_digital: false });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [materialFile, setMaterialFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const pickImage = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.price) return;
    if (form.is_digital && !materialFile) { return; }
    setSaving(true);
    try {
      let image_url = '';
      let file_url = '';
      if (imageFile) {
        const r = await base44.integrations.Core.UploadFile({ file: imageFile });
        image_url = r.file_url;
      }
      if (materialFile) {
        const r = await base44.integrations.Core.UploadFile({ file: materialFile });
        file_url = r.file_url;
      }
      await base44.entities.MarketItem.create({
        ...form, price: Number(form.price), image_url, file_url,
        seller_email: user.email, seller_name: user.full_name,
        seller_avatar: user.avatar_url || '', status: 'available', views: 0,
      });
      toast.success('Listing created successfully!');
      setForm({ title: '', description: '', price: '', category: 'textbook', condition: 'good', subject: '', grade_level: '', is_digital: false });
      setImageFile(null); setImagePreview(null); setMaterialFile(null);
      onCreated?.();
      onClose();
    } catch (e) {
      toast.error(e.message || 'Failed to create listing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const cfg = CAT_CONFIG[form.category];
  const Icon = cfg?.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>List Something for Sale</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">

          {/* Image Upload */}
          <div>
            <Label className="mb-2 block">Photo</Label>
            <label className="relative block cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={pickImage} />
              <div className="aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors overflow-hidden flex items-center justify-center bg-muted">
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    {Icon && <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${cfg.grad} flex items-center justify-center mb-2`}><Icon className="w-8 h-8 text-white/70" /></div>}
                    <p className="text-sm text-muted-foreground">Click to upload a photo</p>
                    <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG up to 5MB</p>
                  </div>
                )}
              </div>
            </label>
          </div>

          <div><Label>Title *</Label><Input value={form.title} onChange={e => setField('title', e.target.value)} placeholder="What are you selling?" /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={3} placeholder="Describe condition, what's included, etc." /></div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={v => setField('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CAT_CONFIG).map(([k, v]) => {
                    const CIcon = v.icon;
                    return <SelectItem key={k} value={k}><span className="flex items-center gap-2"><CIcon className="w-3.5 h-3.5" />{v.label}</span></SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Price (₦)</Label><Input type="number" min="0" step="1" value={form.price} onChange={e => setField('price', e.target.value)} placeholder="0" /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Subject</Label><Input value={form.subject} onChange={e => setField('subject', e.target.value)} placeholder="e.g. Mathematics" /></div>
            <div><Label>Grade / Level</Label><Input value={form.grade_level} onChange={e => setField('grade_level', e.target.value)} placeholder="e.g. Grade 10" /></div>
          </div>

          {!['course', 'tutorial', 'handouts'].includes(form.category) && (
            <div><Label>Condition</Label>
              <div className="flex gap-2 flex-wrap mt-1">
                {CONDITIONS.map(c => (
                  <button key={c.value} onClick={() => setField('condition', c.value)}
                    className={`px-3 py-1.5 text-xs rounded-xl border transition-all font-medium ${form.condition === c.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <input type="checkbox" id="digital" checked={form.is_digital} onChange={e => setField('is_digital', e.target.checked)} className="w-4 h-4 accent-primary" />
            <label htmlFor="digital" className="text-sm cursor-pointer">
              <span className="font-medium">Digital / Downloadable</span>
              <p className="text-xs text-muted-foreground">Files, PDFs, online access (no physical delivery)</p>
            </label>
          </div>

          {/* Material file upload for digital items */}
          {form.is_digital && (
            <div>
              <Label className="mb-2 block">Upload Material File <span className="text-destructive">*</span></Label>
              <label className="cursor-pointer block">
                <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.mp4,.mp3,.png,.jpg,.jpeg" className="hidden"
                  onChange={e => setMaterialFile(e.target.files[0])} />
                <div className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-colors ${materialFile ? 'border-primary/60 bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                  {materialFile ? (
                    <>
                      <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{materialFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(materialFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                      <button type="button" onClick={e => { e.preventDefault(); setMaterialFile(null); }} className="text-muted-foreground hover:text-destructive">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Click to upload your material</p>
                        <p className="text-xs text-muted-foreground">PDF, Word, PPT, ZIP, MP4, MP3 accepted</p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>
          )}

          <Button onClick={handleCreate} disabled={saving || !form.title.trim() || !form.price || (form.is_digital && !materialFile)} className="w-full gradient-brand border-0 h-11 gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
            {saving ? 'Listing...' : 'List for Sale'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}