"use client"

import { useTheme } from 'next-themes'
import { THEME_CLASSES } from '@/lib/theme-config'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Input } from './input'
import { Label } from './label'

export function ThemeDemo() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="p-6 space-y-8">
      {/* Header con toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Demo del Sistema de Dark Mode
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Tema actual: {theme}
          </span>
          <Button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            variant="outline"
          >
            Cambiar Tema
          </Button>
        </div>
      </div>

      {/* Grid de ejemplos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Cards */}
        <Card className={THEME_CLASSES.card + ' ' + THEME_CLASSES.border + ' ' + THEME_CLASSES.shadow}>
          <CardHeader>
            <CardTitle className={THEME_CLASSES.textPrimary}>Card de Ejemplo</CardTitle>
            <CardDescription className={THEME_CLASSES.textSecondary}>
              Esta card se adapta automáticamente al tema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={THEME_CLASSES.textSecondary}>
              El contenido se adapta usando las clases predefinidas del sistema de temas.
            </p>
          </CardContent>
        </Card>

        {/* Botones */}
        <Card className={THEME_CLASSES.card + ' ' + THEME_CLASSES.border + ' ' + THEME_CLASSES.shadow}>
          <CardHeader>
            <CardTitle className={THEME_CLASSES.textPrimary}>Botones</CardTitle>
            <CardDescription className={THEME_CLASSES.textSecondary}>
              Diferentes variantes de botones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full">Botón Primario</Button>
            <Button variant="outline" className="w-full">Botón Outline</Button>
            <Button variant="secondary" className="w-full">Botón Secundario</Button>
          </CardContent>
        </Card>

        {/* Formularios */}
        <Card className={THEME_CLASSES.card + ' ' + THEME_CLASSES.border + ' ' + THEME_CLASSES.shadow}>
          <CardHeader>
            <CardTitle className={THEME_CLASSES.textPrimary}>Formularios</CardTitle>
            <CardDescription className={THEME_CLASSES.textSecondary}>
              Campos de entrada adaptativos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email" className={THEME_CLASSES.textPrimary}>Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="tu@email.com"
                className={THEME_CLASSES.input}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className={THEME_CLASSES.textPrimary}>Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                className={THEME_CLASSES.input}
              />
            </div>
          </CardContent>
        </Card>

        {/* Badges y Estados */}
        <Card className={THEME_CLASSES.card + ' ' + THEME_CLASSES.border + ' ' + THEME_CLASSES.shadow}>
          <CardHeader>
            <CardTitle className={THEME_CLASSES.textPrimary}>Badges y Estados</CardTitle>
            <CardDescription className={THEME_CLASSES.textSecondary}>
              Indicadores visuales adaptativos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Colores de Marca */}
        <Card className={THEME_CLASSES.card + ' ' + THEME_CLASSES.border + ' ' + THEME_CLASSES.shadow}>
          <CardHeader>
            <CardTitle className={THEME_CLASSES.textPrimary}>Colores de Marca</CardTitle>
            <CardDescription className={THEME_CLASSES.textSecondary}>
              Paleta de Compralo adaptativa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-600 dark:bg-red-500 rounded"></div>
                <span className={THEME_CLASSES.textSecondary}>Primario (Rojo)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-orange-600 dark:bg-orange-500 rounded"></div>
                <span className={THEME_CLASSES.textSecondary}>Secundario (Naranja)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-500 dark:bg-yellow-400 rounded"></div>
                <span className={THEME_CLASSES.textSecondary}>Acento (Amarillo)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del Sistema */}
        <Card className={THEME_CLASSES.card + ' ' + THEME_CLASSES.border + ' ' + THEME_CLASSES.shadow}>
          <CardHeader>
            <CardTitle className={THEME_CLASSES.textPrimary}>Sistema de Temas</CardTitle>
            <CardDescription className={THEME_CLASSES.textSecondary}>
              Información técnica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={THEME_CLASSES.textSecondary}>Tema actual:</span>
                <span className={THEME_CLASSES.textPrimary}>{theme}</span>
              </div>
              <div className="flex justify-between">
                <span className={THEME_CLASSES.textSecondary}>Transiciones:</span>
                <span className={THEME_CLASSES.textPrimary}>300ms</span>
              </div>
              <div className="flex justify-between">
                <span className={THEME_CLASSES.textSecondary}>CSS Variables:</span>
                <span className={THEME_CLASSES.textPrimary}>Sí</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Código de ejemplo */}
      <Card className={THEME_CLASSES.card + ' ' + THEME_CLASSES.border + ' ' + THEME_CLASSES.shadow}>
        <CardHeader>
          <CardTitle className={THEME_CLASSES.textPrimary}>Código de Ejemplo</CardTitle>
          <CardDescription className={THEME_CLASSES.textSecondary}>
            Cómo usar el sistema de temas en tus componentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
            <code className="text-sm text-gray-800 dark:text-gray-200">
{`// Usar clases predefinidas
import { THEME_CLASSES } from '@/lib/theme-config'

<div className={\`\${THEME_CLASSES.card} \${THEME_CLASSES.border}\`}>
  <h2 className={THEME_CLASSES.textPrimary}>Título</h2>
  <p className={THEME_CLASSES.textSecondary}>Contenido</p>
</div>

// Usar hook para clases condicionales
import { useThemeClasses } from '@/hooks/use-theme-colors'

const { card, textPrimary } = useThemeClasses()

<div className={card}>
  <h2 className={textPrimary}>Título</h2>
</div>`}
            </code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
