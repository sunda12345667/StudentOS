import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Download, Trash2, Loader2, FolderOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

const FILE_ICONS = { pdf: '📄', doc: '📝', docx: '📝', ppt: '📊', pptx: '📊', xls: '📈', xlsx: '📈', zip: '📦', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', mp4: '🎬', mp3: '🎵' };

export default function GroupFiles({ groupId, user, isAdmin }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [desc, setDesc] = useState('');

  useEffect(() => {
    base44.entities.GroupFile.filter({ group_id: groupId }, '-created_date', 50)
      .then(setFiles).finally(() => setLoading(false));
  }, [groupId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const r = await base44.integrations.Core.UploadFile({ file });
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    await base44.entities.GroupFile.create({
      group_id: groupId, name: file.name, file_url: r.file_url,
      file_type: ext, file_size: (file.size / 1024 > 1024 ? (file.size / 1048576).toFixed(1) + ' MB' : (file.size / 1024).toFixed(0) + ' KB'),
      uploaded_by: user.email, uploader_name: user.full_name,
      description: desc,
    });
    const updated = await base44.entities.GroupFile.filter({ group_id: groupId }, '-created_date', 50);
    setFiles(updated);
    setDesc(''); setUploading(false);
    e.target.value = '';
  };

  const deleteFile = async (id) => {
    await base44.entities.GroupFile.delete(id);
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2"><FolderOpen className="w-4 h-4 text-primary" />Shared Files</h3>
        <label>
          <input type="file" className="hidden" onChange={handleUpload} />
          <Button size="sm" className="gradient-brand border-0 gap-1.5 cursor-pointer" asChild disabled={uploading}>
            <span>{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}Upload File</span>
          </Button>
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No files shared yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file, i) => {
            const ext = file.file_type || file.name?.split('.').pop()?.toLowerCase() || '';
            const icon = FILE_ICONS[ext] || '📎';
            const isOwner = file.uploaded_by === user?.email;
            return (
              <motion.div key={file.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="p-3 flex items-center gap-3 hover:shadow-sm transition-all group">
                  <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-xl flex-shrink-0">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-muted-foreground">{file.uploader_name} · {formatDistanceToNow(new Date(file.created_date), { addSuffix: true })}</p>
                      {file.file_size && <Badge variant="outline" className="text-[9px] px-1 py-0">{file.file_size}</Badge>}
                    </div>
                    {file.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{file.description}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer" download>
                      <Button size="icon" variant="ghost" className="h-8 w-8"><Download className="w-3.5 h-3.5" /></Button>
                    </a>
                    {(isOwner || isAdmin) && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteFile(file.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}