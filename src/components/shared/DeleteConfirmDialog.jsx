import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, RotateCcw, Loader2 } from 'lucide-react';

/**
 * Reusable deletion confirmation dialog with recycle bin support.
 * Props:
 *   open, onOpenChange
 *   title      – item name
 *   itemType   – "course" | "community" | "campus_group" | "assignment" | "market_item"
 *   onConfirm  – async () => void – called when user confirms delete
 *   loading    – bool
 */
export default function DeleteConfirmDialog({ open, onOpenChange, title, itemType, onConfirm, loading }) {
  const typeLabel = {
    course: 'Course',
    community: 'Community',
    campus_group: 'Study Group',
    assignment: 'Assignment',
    market_item: 'Listing',
    post: 'Post',
  }[itemType] || 'Item';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete {typeLabel}?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            You are about to delete <span className="font-semibold text-foreground">"{title}"</span>.
            This will move it to the <strong>Recycle Bin</strong> for 30 days, after which it will be
            permanently removed.
          </p>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2">
            <RotateCcw className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              You can restore this item from <strong>Settings → Recycle Bin</strong> within 30 days.
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1 gap-2" onClick={onConfirm} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}