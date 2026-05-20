import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>¡Bienvenido a Tu Expertos es Nexus!</h1>
      <p>La plataforma está en construcción.</p>
    </div>
  )
}
