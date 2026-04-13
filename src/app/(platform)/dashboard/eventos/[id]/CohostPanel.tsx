"use client";

import { useState } from "react";
import { UserPlus, Trash2, ChevronDown } from "lucide-react";

type HostRole = "cohost" | "operator" | "viewer";

interface CoHost {
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: HostRole;
}

interface Props {
  eventId: string;
  initialHosts: CoHost[];
}

const ROLE_LABELS: Record<HostRole, string> = {
  cohost: "Co-organizador",
  operator: "Operador",
  viewer: "Espectador",
};

const ASSIGNABLE_ROLES: HostRole[] = ["cohost", "operator", "viewer"];

export default function CohostPanel({ eventId, initialHosts }: Props) {
  const [hosts, setHosts] = useState<CoHost[]>(initialHosts);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<HostRole>("cohost");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/eventos/${eventId}/hosts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al invitar");
      }
      const newHost: CoHost = await res.json();
      setHosts((prev) => [...prev, newHost]);
      setEmail("");
      setSuccess(`${newHost.name ?? newHost.email} ha sido añadido como ${ROLE_LABELS[newHost.role]}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeRole(hostUserId: string, newRole: HostRole) {
    setChangingRoleId(hostUserId);
    setError(null);
    try {
      const res = await fetch(`/api/eventos/${eventId}/hosts/${hostUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al cambiar rol");
      }
      setHosts((prev) =>
        prev.map((h) => (h.userId === hostUserId ? { ...h, role: newRole } : h)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setChangingRoleId(null);
    }
  }

  async function handleRevoke(hostUserId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/eventos/${eventId}/hosts/${hostUserId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al revocar");
      }
      setHosts((prev) => prev.filter((h) => h.userId !== hostUserId));
      setRevokingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pm-card" style={{ padding: "24px" }}>
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "4px" }}>
        Co-organizadores
      </h2>
      <p style={{ fontSize: "0.82rem", color: "var(--neutral-500)", marginBottom: "20px" }}>
        Comparte la gestión del evento con otras personas de tu equipo.
      </p>

      {/* Current hosts */}
      {hosts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
          {hosts.map((host) => (
            <div
              key={host.userId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                background: "var(--neutral-50)",
              }}
            >
              {/* Avatar */}
              {host.avatarUrl ? (
                <img
                  src={host.avatarUrl}
                  alt={host.name ?? host.email}
                  style={{ width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "var(--neutral-200)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "var(--neutral-600)",
                    flexShrink: 0,
                  }}
                >
                  {(host.name ?? host.email)[0].toUpperCase()}
                </div>
              )}

              {/* Name + email */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {host.name ?? host.email}
                </div>
                {host.name && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--neutral-500)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {host.email}
                  </div>
                )}
              </div>

              {/* Role selector */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <select
                  value={host.role}
                  onChange={(e) => handleChangeRole(host.userId, e.target.value as HostRole)}
                  disabled={changingRoleId === host.userId}
                  style={{
                    appearance: "none",
                    padding: "4px 24px 4px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--neutral-200)",
                    fontSize: "0.78rem",
                    background: "white",
                    cursor: "pointer",
                    color: "var(--neutral-700)",
                  }}
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  style={{
                    position: "absolute",
                    right: "6px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "var(--neutral-500)",
                  }}
                />
              </div>

              {/* Revoke */}
              {revokingId === host.userId ? (
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", flexShrink: 0 }}>
                  <span style={{ color: "var(--neutral-500)" }}>¿Revocar?</span>
                  <button
                    className="btn btn--primary"
                    style={{
                      padding: "3px 9px",
                      fontSize: "0.75rem",
                      background: "#dc2626",
                      borderColor: "#dc2626",
                    }}
                    onClick={() => handleRevoke(host.userId)}
                    disabled={loading}
                  >
                    Sí
                  </button>
                  <button
                    className="btn btn--ghost"
                    style={{ padding: "3px 9px", fontSize: "0.75rem" }}
                    onClick={() => setRevokingId(null)}
                  >
                    No
                  </button>
                </span>
              ) : (
                <button
                  className="btn btn--ghost"
                  style={{ padding: "6px 8px", flexShrink: 0 }}
                  onClick={() => setRevokingId(host.userId)}
                  title="Revocar acceso"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invite form */}
      <form onSubmit={handleInvite}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            className="pm-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            required
            style={{ flex: "1 1 200px" }}
          />
          <select
            className="pm-input"
            value={role}
            onChange={(e) => setRole(e.target.value as HostRole)}
            style={{ flex: "0 0 auto" }}
          >
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}
          >
            <UserPlus size={15} />
            {loading ? "Invitando…" : "Invitar"}
          </button>
        </div>
      </form>

      {/* Feedback */}
      {error && (
        <div
          style={{
            marginTop: "12px",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            background: "rgba(239,68,68,0.08)",
            color: "#dc2626",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            marginTop: "12px",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            background: "rgba(16,185,129,0.08)",
            color: "#059669",
            fontSize: "0.85rem",
          }}
        >
          {success}
        </div>
      )}
    </div>
  );
}
