<div align="center">
  <a href="index.md">← Índice</a> &nbsp;·&nbsp;
  <a href="../en/pages.md">🇬🇧 Read in English</a>
</div>

<br>

# Páginas

| Página | Ruta | Punto de entrada | Descripción |
|---|---|---|---|
| **Chat** | `/` | `index.html` | Interfaz principal. Abre una conversación con cualquier agente configurado |
| **Agentes** | `/agents/` | `agents/index.html` | Crear, configurar y gestionar agentes. Adjuntar skills y definir el system prompt |
| **Conexiones** | `/connections/` | `connections/index.html` | Añadir y gestionar claves API para proveedores de IA |
| **Memoria** | `/memory/` | `memory/index.html` | Leer y editar la memoria persistente de cada agente |
| **Skills** | `/skills/` | `skills/index.html` | Explorar las skills disponibles por idioma y categoría |
| **Perfil** | `/profile/` | `profile/index.html` | Ajustes de usuario |
| **Admin** | `/admin/` | `admin/index.html` | Gestión de usuarios — listar y eliminar cuentas (rol admin requerido) |
| **Login** | `/login/` | `login/index.html` | Autenticación |
| **Registro** | `/register/` | `register/index.html` | Crear una nueva cuenta |

---

## Añadir una nueva página

1. Crear un directorio: `mi-pagina/`
2. Añadir `mi-pagina/index.html` — copiar la estructura de una página existente
3. Añadir `mi-pagina/mi-pagina.js` para la lógica específica de la página
4. Cargar los scripts compartidos antes del módulo de página en `<head>`

nginx la servirá automáticamente en `/mi-pagina/` sin ninguna configuración adicional.
