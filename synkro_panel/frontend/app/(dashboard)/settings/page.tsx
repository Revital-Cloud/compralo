'use client';

import Link from 'next/link';
import {
  User,
  Bell,
  Shield,
  Settings as SettingsIcon,
  ChevronRight,
  Building2,
  Key,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui";

const settingsSections = [
  {
    title: 'Profile',
    description: 'Manage your company and contact information',
    icon: User,
    href: '/settings/profile',
  },
  {
    title: 'Security',
    description: 'Change your password and security settings',
    icon: Shield,
    href: '/settings/security',
  },
  {
    title: 'Notifications',
    description: 'Configure email and push notifications',
    icon: Bell,
    href: '/settings/notifications',
    disabled: true,
    comingSoon: true,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsSections.map((section) => (
          <Link 
            key={section.title}
            href={section.disabled ? '#' : section.href}
            className={section.disabled ? 'cursor-not-allowed' : ''}
          >
            <Card className={`h-full transition-all hover:shadow-md ${
              section.disabled 
                ? 'opacity-60' 
                : 'hover:border-synkro-green/50'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <section.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{section.title}</h3>
                        {section.comingSoon && (
                          <span className="text-xs bg-synkro-green/10 text-synkro-green px-2 py-0.5 rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  {!section.disabled && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Company Profile</span>
            </div>
            <Link 
              href="/settings/profile" 
              className="text-sm text-synkro-green hover:underline"
            >
              Edit
            </Link>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Key className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Password</span>
            </div>
            <Link 
              href="/settings/security" 
              className="text-sm text-synkro-green hover:underline"
            >
              Change
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
