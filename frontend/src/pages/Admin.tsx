import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { getAdminStats, getAdminUsers } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { AdminStats, AdminUser } from '../types'

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-5 shadow-card">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-soft mb-2">{label}</div>
      <div className="text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  )
}

export function Admin() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.is_admin) return
    Promise.all([getAdminStats(), getAdminUsers()])
      .then(([s, u]) => {
        setStats(s)
        setUsers(u)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Falha ao carregar painel.'))
  }, [user])

  if (!user?.is_admin) {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight mb-8">Painel administrativo</h1>

        {error && <p className="text-danger text-sm mb-4">{error}</p>}

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <StatCard label="Usuários" value={stats.total_users} />
            <StatCard label="Assinantes ativos" value={stats.subscribed_users} />
            <StatCard label="Análises totais" value={stats.total_analyses} />
          </div>
        )}

        <div className="text-xs font-medium uppercase tracking-wide text-ink-soft mb-3">Usuários</div>
        <div className="rounded-2xl border border-line bg-panel overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Criada em</th>
                <th className="px-4 py-3 font-medium">Assinante</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium text-right">Análises</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_subscribed ? (
                      <span className="rounded-full bg-success-soft text-success text-xs font-medium px-2.5 py-0.5">Sim</span>
                    ) : (
                      <span className="text-ink-soft">Não</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_admin ? (
                      <span className="rounded-full bg-accent-soft text-accent text-xs font-medium px-2.5 py-0.5">Admin</span>
                    ) : (
                      <span className="text-ink-soft">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{u.analyses_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {users?.length === 0 && (
            <p className="text-ink-soft text-sm px-4 py-6">Nenhum usuário ainda.</p>
          )}
        </div>
      </div>
    </div>
  )
}
