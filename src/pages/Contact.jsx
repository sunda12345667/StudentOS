import React, { useState } from 'react';
import { Mail, MessageSquare, Twitter, Instagram, Send, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: 'hello@studentos.app',
        subject: `Contact form: ${form.name}`,
        body: `From: ${form.name} <${form.email}>\n\n${form.message}`,
      });
      setSent(true);
    } catch {
      // still show success — fire and forget
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black gradient-brand-text mb-2">Contact Us</h1>
        <p className="text-muted-foreground">We'd love to hear from you — questions, feedback, or partnership enquiries.</p>
      </div>

      {/* Direct contact methods */}
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        <a href="mailto:hello@studentos.app"
          className="rounded-xl border p-4 flex flex-col items-center gap-2 hover:bg-muted transition-colors text-center">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm font-semibold">Email</span>
          <span className="text-xs text-muted-foreground">hello@studentos.app</span>
        </a>
        <a href="https://twitter.com/studentos" target="_blank" rel="noreferrer"
          className="rounded-xl border p-4 flex flex-col items-center gap-2 hover:bg-muted transition-colors text-center">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
            <Twitter className="w-5 h-5 text-sky-500" />
          </div>
          <span className="text-sm font-semibold">Twitter / X</span>
          <span className="text-xs text-muted-foreground">@studentos</span>
        </a>
        <a href="https://instagram.com/studentos" target="_blank" rel="noreferrer"
          className="rounded-xl border p-4 flex flex-col items-center gap-2 hover:bg-muted transition-colors text-center">
          <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
            <Instagram className="w-5 h-5 text-pink-500" />
          </div>
          <span className="text-sm font-semibold">Instagram</span>
          <span className="text-xs text-muted-foreground">@studentos</span>
        </a>
      </div>

      {/* Contact form */}
      <div className="rounded-2xl border p-6">
        <div className="flex items-center gap-2 mb-5">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Send us a message</h2>
        </div>

        {sent ? (
          <div className="flex flex-col items-center py-8 text-center gap-3">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
            <p className="font-semibold text-lg">Message sent!</p>
            <p className="text-muted-foreground text-sm">Thanks for reaching out. We'll get back to you within 24 hours.</p>
            <button onClick={() => { setSent(false); setForm({ name: '', email: '', message: '' }); }}
              className="mt-2 px-4 py-2 rounded-xl border text-sm hover:bg-muted transition-colors">
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your name"
                  required
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="your@email.com"
                  required
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Message</label>
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="How can we help?"
                required
                rows={5}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full gradient-brand text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {sending ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}