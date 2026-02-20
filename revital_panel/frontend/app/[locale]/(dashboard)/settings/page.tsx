'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  User,
  Bell,
  Shield,
  Settings as SettingsIcon,
  ChevronRight,
  Building2,
  Key,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  const locale = useLocale();
  const t = useTranslations();
  const localePrefix = `/${locale}`;

  const settingsSections = [
    {
      title: t('settings.sections.profile.title'),
      description: t('settings.sections.profile.description'),
      icon: User,
      href: `${localePrefix}/settings/profile`,
    },
    {
      title: t('settings.sections.security.title'),
      description: t('settings.sections.security.description'),
      icon: Shield,
      href: `${localePrefix}/settings/security`,
    },
    {
      title: t('settings.sections.notifications.title'),
      description: t('settings.sections.notifications.description'),
      icon: Bell,
      href: `${localePrefix}/settings/notifications`,
      disabled: true,
      comingSoon: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('settings.subtitle')}
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
                : 'hover:border-revital-green/50'
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
                          <span className="text-xs bg-revital-green/10 text-revital-green px-2 py-0.5 rounded-full">
                            {t('settings.comingSoon')}
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
          <CardTitle className="text-base">{t('settings.accountInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{t('settings.companyProfile')}</span>
            </div>
            <Link 
              href={`${localePrefix}/settings/profile`} 
              className="text-sm text-revital-green hover:underline"
            >
              {t('common.edit')}
            </Link>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Key className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{t('settings.password')}</span>
            </div>
            <Link 
              href={`${localePrefix}/settings/security`} 
              className="text-sm text-revital-green hover:underline"
            >
              {t('common.edit')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
