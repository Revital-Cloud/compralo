import { LucideIcon } from "lucide-react";

export interface FooterLink {
  title: string;
  href: string;
  icon?: LucideIcon;
}

export interface FooterSection {
  label: string;
  links: FooterLink[];
}

export interface FooterContent {
  company: {
    name: string;
    description: string;
  };
  sections: FooterSection[];
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
  };
  copyright: string;
}
