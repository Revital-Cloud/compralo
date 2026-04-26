import type { ProductSocialProof } from "@/types/product"

interface SocialProofWidgetProps {
  socialProof: ProductSocialProof
}

export default function SocialProofWidget({ socialProof }: SocialProofWidgetProps) {
  const messages: string[] = []

  if (socialProof.show_weekly_purchases) {
    messages.push(`${socialProof.weekly_purchases} personas compraron este producto esta semana`)
  }

  if (socialProof.show_low_stock) {
    messages.push(`Quedan ${socialProof.stock_left} unidades`)
  }

  if (messages.length === 0) return null

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/60 dark:bg-amber-950/30">
      <ul className="space-y-1">
        {messages.map((message) => (
          <li key={message} className="text-sm font-medium text-amber-900 dark:text-amber-200">
            {message}
          </li>
        ))}
      </ul>
    </div>
  )
}
