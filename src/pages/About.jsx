import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Users, BookOpen, ShoppingBag, Brain, Star } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center shadow-lg">
          <span className="text-white font-black text-2xl">S</span>
        </div>
        <div>
          <h1 className="text-3xl font-black gradient-brand-text">About StudentOS</h1>
          <p className="text-muted-foreground text-sm">The all-in-one campus operating system</p>
        </div>
      </div>

      <div className="prose prose-neutral max-w-none space-y-6 text-foreground">
        <p className="text-lg leading-relaxed">
          <strong>StudentOS</strong> is a comprehensive social and academic platform built specifically for students and educators across Africa and beyond. We believe that great education deserves great tools — tools that are modern, accessible, and actually fun to use.
        </p>

        <p className="leading-relaxed">
          Our platform brings together everything a student needs in one place: a vibrant social feed to connect with peers, a full-featured classroom for courses and assignments, a bustling marketplace to buy and sell textbooks and study materials, and an AI-powered tutor available around the clock. Whether you are cramming for finals, collaborating on a group project, or selling your old notes, StudentOS has you covered.
        </p>

        <p className="leading-relaxed">
          StudentOS is built for <strong>university and secondary school students</strong> who want to stay organised, collaborate easily, and make the most of their academic journey. It is also built for <strong>teachers and lecturers</strong> who want a simple, powerful way to share resources, set assignments, and engage with their classes. Parents, tutors, and campus administrators round out our growing community.
        </p>

        <p className="leading-relaxed">
          The platform is developed by a passionate team of engineers and educators who have lived the student experience firsthand. We are dedicated to building software that solves real campus problems — from finding affordable textbooks to getting instant homework help at 2 AM. We ship updates regularly, listen closely to our community, and are committed to keeping the core platform free and accessible to every student.
        </p>

        <p className="leading-relaxed">
          Our key features include a social feed with stories and reels, campus groups and communities, a peer-to-peer marketplace with escrow payments, an AI study tutor, live notifications, a daily planner, and a robust wallet system for secure transactions. We are proud to be building the future of campus life — one feature at a time.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { icon: GraduationCap, label: 'Students & Lecturers', color: 'text-primary bg-primary/10' },
          { icon: Users, label: 'Campus Communities', color: 'text-violet-600 bg-violet-50' },
          { icon: BookOpen, label: 'Courses & Assignments', color: 'text-blue-600 bg-blue-50' },
          { icon: ShoppingBag, label: 'Peer Marketplace', color: 'text-emerald-600 bg-emerald-50' },
          { icon: Brain, label: 'AI Tutor 24/7', color: 'text-amber-600 bg-amber-50' },
          { icon: Star, label: 'Built with ❤️ in Africa', color: 'text-rose-600 bg-rose-50' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="rounded-xl border p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <Link to="/" className="px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold">
          Get Started
        </Link>
        <Link to="/contact" className="px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-muted transition-colors">
          Contact Us
        </Link>
      </div>
    </div>
  );
}