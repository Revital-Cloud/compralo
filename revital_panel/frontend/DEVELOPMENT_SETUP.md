# 🛠️ Configuración de Desarrollo - Revital Landing

## 📋 Configuración de Indentación

Este proyecto está configurado para usar **tab size 2** en todos los archivos. La configuración se aplica a través de múltiples herramientas para garantizar consistencia.

### 🎯 Configuración Aplicada

#### **1. EditorConfig (`.editorconfig`)**

- Configuración global para todos los editores
- Tab size: 2 espacios
- Estilo: Espacios (no tabs)
- Final de línea: LF (Unix)

#### **2. Prettier (`.prettierrc`)**

- Formateador de código automático
- `tabWidth: 2`
- `useTabs: false`
- Formateo automático al guardar

#### **3. ESLint (`eslint.config.mjs`)**

- Linter para TypeScript/React
- Integrado con Prettier
- Reglas de consistencia sin conflictos

#### **4. VS Code (`.vscode/settings.json`)**

- Configuración específica del editor
- `editor.tabSize: 2`
- Formateo automático al guardar
- ESLint auto-fix al guardar

## 🚀 Scripts Disponibles

### **Linting y Formateo**

```bash
# Verificar linting
npm run lint

# Corregir problemas de linting automáticamente
npm run lint:fix

# Formatear todo el código con Prettier
npm run format

# Verificar formato sin cambiar archivos
npm run format:check
```

### **Desarrollo**

```bash
# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Servidor de producción
npm run start
```

## 🔧 Instalación de Dependencias

### **Dependencias de Desarrollo Agregadas**

```bash
npm install --save-dev prettier eslint-config-prettier
```

### **Extensiones de VS Code Recomendadas**

1. **Prettier - Code formatter** (`esbenp.prettier-vscode`)
2. **ESLint** (`dbaeumer.vscode-eslint`)
3. **EditorConfig for VS Code** (`EditorConfig.EditorConfig`)

## 📁 Estructura de Archivos de Configuración

```
revital_landing/
├── .editorconfig          # Configuración global de editores
├── .prettierrc            # Configuración de Prettier
├── .prettierignore        # Archivos ignorados por Prettier
├── .vscode/
│   └── settings.json      # Configuración específica de VS Code
├── eslint.config.mjs      # Configuración de ESLint
├── package.json           # Scripts y dependencias
└── tsconfig.json          # Configuración de TypeScript
```

## 🎨 Reglas de Formateo

### **Indentación**

- **Todos los archivos**: 2 espacios
- **No usar tabs**: Solo espacios
- **Consistencia**: Aplicado a TypeScript, JavaScript, JSX, CSS, JSON, etc.

### **Estilo de Código**

- **Punto y coma**: Sí
- **Comillas**: Dobles
- **Coma final**: ES5
- **Ancho máximo**: 80 caracteres
- **Final de línea**: LF (Unix)

### **Archivos Excluidos del Formateo**

- `node_modules/`
- `.next/`
- Archivos de build
- Archivos de lock (`package-lock.json`)
- Archivos minificados

## 🔍 Verificación de Configuración

### **1. Verificar que ESLint funcione**

```bash
npm run lint
```

### **2. Verificar que Prettier funcione**

```bash
npm run format:check
```

### **3. Formatear todo el proyecto**

```bash
npm run format
```

## 🚨 Solución de Problemas

### **Conflicto entre ESLint y Prettier**

- ESLint está configurado para no conflictuar con Prettier
- Se usa `eslint-config-prettier` para deshabilitar reglas conflictivas
- Prettier maneja el formateo, ESLint maneja la calidad del código

### **Archivos no se formatean automáticamente**

1. Verificar que la extensión Prettier esté instalada
2. Verificar que `formatOnSave` esté habilitado en VS Code
3. Verificar que Prettier sea el formateador por defecto

### **Indentación incorrecta**

1. Verificar que `.editorconfig` esté en la raíz del proyecto
2. Verificar configuración de VS Code
3. Ejecutar `npm run format` para reformatear todo

## 📚 Recursos Adicionales

### **Documentación Oficial**

- [EditorConfig](https://editorconfig.org/)
- [Prettier](https://prettier.io/)
- [ESLint](https://eslint.org/)
- [VS Code Settings](https://code.visualstudio.com/docs/getstarted/settings)

### **Configuración de Otros Editores**

- **WebStorm/IntelliJ**: Soporta `.editorconfig` nativamente
- **Sublime Text**: Instalar plugin EditorConfig
- **Vim/Neovim**: Configurar para usar 2 espacios
- **Atom**: Soporta `.editorconfig` nativamente

---

**Nota**: Esta configuración garantiza que todos los desarrolladores del proyecto tengan la misma experiencia de formateo, independientemente del editor que usen.
