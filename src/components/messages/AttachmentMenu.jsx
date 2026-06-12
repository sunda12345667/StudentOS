import React, { useRef } from 'react';
import { Image, FileText, BookOpen, Film, X } from 'lucide-react';

const MENU_ITEMS = [
  { label: 'Upload Image', icon: Image, color: 'text-blue-500 bg-blue-500/10', accept: 'image/*', type: 'image' },
  { label: 'Upload Video', icon: Film, color: 'text-purple-500 bg-purple-500/10', accept: 'video/*', type: 'video' },
  { label: 'Upload Document', icon: FileText, color: 'text-orange-500 bg-orange-500/10', accept: '.pdf,.doc,.docx,.ppt,.pptx', type: 'document' },
  { label: 'Course Material', icon: BookOpen, color: 'text-green-500 bg-green-500/10', accept: '.pdf,.doc,.docx,.ppt,.pptx,image/*', type: 'document' },
];

export default function AttachmentMenu({ onFileSelected, onClose }) {
  const fileRefs = useRef({});

  const handleItemClick = (item) => {
    // Trigger hidden file input
    const input = fileRefs.current[item.type];
    if (input) input.click();
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate size (25MB max)
    if (file.size > 25 * 1024 * 1024) {
      alert('File too large. Maximum size is 25MB.');
      e.target.value = '';
      return;
    }
    onFileSelected(file, type);
    onClose();
    e.target.value = '';
  };

  return (
    <div className="absolute bottom-full left-0 mb-2 w-52 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
      <div className="p-1">
        {MENU_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <React.Fragment key={item.type + item.label}>
              <input
                ref={el => fileRefs.current[item.type] = el}
                type="file"
                accept={item.accept}
                className="hidden"
                onChange={e => handleFileChange(e, item.type)}
              />
              <button
                type="button"
                onClick={() => handleItemClick(item)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}