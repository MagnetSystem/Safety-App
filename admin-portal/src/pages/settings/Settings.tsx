import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { changePassword, updateMyProfile } from "../../services/authService";
import {
  getJoinCode,
  getMyOrganization,
  rotateJoinCode,
  updateMyOrgSettings,
  updateMyOrganization,
} from "../../services/organizationsService";

type Tab = "account" | "organization" | "features" | "access";

export default function Settings() {
  const { user, role, updateLocalUser } = useAuth();
  const [tab, setTab] = useState<Tab>("account");
  const canOrg = role === "admin" || role === "owner";
  const canFeatures = role === "owner";

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "account", label: "My account", show: true },
    { id: "organization", label: "Organization", show: canOrg },
    { id: "features", label: "Safety features", show: canFeatures },
    { id: "access", label: "Join & access", show: canOrg },
  ];

  return (
    <div className="page-shell">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Settings</p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Account & organization</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage how you sign in and how this tenant is set up.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.filter((t) => t.show).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${tab === t.id ? "bg-teal-600 text-white" : "bg-white border border-border text-slate-600"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "account" && (
        <AccountPanel
          name={user?.name ?? ""}
          email={user?.email ?? ""}
          onNameSaved={(name) => updateLocalUser({ name })}
        />
      )}
      {tab === "organization" && canOrg && <OrganizationPanel />}
      {tab === "features" && canFeatures && <FeaturesPanel />}
      {tab === "access" && canOrg && <AccessPanel />}
    </div>
  );
}

export function AccountPanel({
  name,
  email,
  onNameSaved,
  allowName = true,
}: {
  name: string;
  email: string;
  onNameSaved?: (name: string) => void;
  allowName?: boolean;
}) {
  const [displayName, setDisplayName] = useState(name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => setDisplayName(name), [name]);

  const saveName = async () => {
    setError("");
    setSaving(true);
    try {
      await updateMyProfile({ name: displayName.trim() });
      onNameSaved?.(displayName.trim());
      setMessage("Name saved.");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Could not save name.");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    setError("");
    setMessage("");
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password updated.");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Could not change password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-xl">
      {message && <div className="px-3 py-2 rounded-xl bg-teal-50 text-teal-800 text-sm">{message}</div>}
      {error && <div className="px-3 py-2 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="surface-card p-5 space-y-3">
        <h2 className="font-medium">Profile</h2>
        <label className="block text-sm">
          Email
          <input value={email} disabled className="mt-1 w-full border rounded-xl px-3 py-2 bg-slate-50 text-slate-500" />
        </label>
        {allowName && (
          <>
            <label className="block text-sm">
              Display name
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 w-full border rounded-xl px-3 py-2" />
            </label>
            <button onClick={saveName} disabled={saving} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">
              Save name
            </button>
          </>
        )}
      </div>

      <div className="surface-card p-5 space-y-3">
        <h2 className="font-medium">Change password</h2>
        <input type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <input type="password" placeholder="New password (min 8)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <button onClick={savePassword} disabled={saving} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm inline-flex items-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin" />}
          Update password
        </button>
      </div>
    </div>
  );
}

function OrganizationPanel() {
  const { updateLocalUser } = useAuth();
  const [org, setOrg] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyOrganization().then(setOrg).catch(() => setError("Could not load organization."));
  }, []);

  if (!org) return <div className="text-sm text-slate-500">{error || "Loading…"}</div>;

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateMyOrganization({
        name: org.name,
        address: org.address,
        state: org.state,
        district: org.district,
        principal: org.contactName,
        phone: org.phone,
        email: org.email,
      });
      setOrg(updated);
      updateLocalUser({ organizationName: updated.name, collegeName: updated.name });
    } catch {
      setError("Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="surface-card p-5 space-y-3 max-w-xl">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-slate-400">Type: {org.organizationType?.label ?? org.industry}</p>
      {["name", "contactName", "phone", "email", "address", "state", "district"].map((key) => (
        <label key={key} className="block text-sm capitalize">
          {key === "contactName" ? "Contact name" : key}
          <input
            value={org[key] ?? ""}
            onChange={(e) => setOrg({ ...org, [key]: e.target.value })}
            className="mt-1 w-full border rounded-xl px-3 py-2"
          />
        </label>
      ))}
      <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm">
        Save organization
      </button>
    </div>
  );
}

function FeaturesPanel() {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyOrganization().then((org) => setSettings(org.settings ?? {})).catch(() => undefined);
  }, []);

  if (!settings) return <div className="text-sm text-slate-500">Loading…</div>;

  const features = settings.features ?? {};
  const toggle = (key: string) =>
    setSettings({ ...settings, features: { ...features, [key]: !features[key] } });

  const save = async () => {
    setSaving(true);
    try {
      await updateMyOrgSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="surface-card p-5 space-y-3 max-w-xl">
      <p className="text-sm text-slate-500">These apply only to this organization.</p>
      {[
        ["reporting", "Members can file routine reports"],
        ["departmentsEnabled", "Route cases by department"],
        ["guardianAlerts", "Alert linked guardians on SOS"],
        ["bulkSignup", "Allow bulk member import"],
      ].map(([key, label]) => (
        <label key={key} className="flex items-center gap-3 text-sm border rounded-xl px-3 py-2">
          <input type="checkbox" checked={!!features[key]} onChange={() => toggle(key)} />
          {label}
        </label>
      ))}
      <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm">
        Save features
      </button>
    </div>
  );
}

function AccessPanel() {
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJoinCode();
        if (!cancelled) setJoinCode((res.joinCode ?? "").toUpperCase());
      } catch {
        try {
          const org = await getMyOrganization();
          if (!cancelled) setJoinCode((org.joinCode ?? "").toUpperCase());
        } catch {
          if (!cancelled) setError("Could not load the join code.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rotate = async () => {
    setError("");
    if (joinCode && !window.confirm("The old code will stop working immediately. Generate a new one?")) return;
    setBusy(true);
    try {
      const res = await rotateJoinCode();
      const next = (res.joinCode ?? "").toUpperCase();
      if (!next) {
        setError("The server did not return an access code. Try again.");
        return;
      }
      setJoinCode(next);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Could not generate the access code.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!joinCode) return;
    await navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="surface-card p-5 space-y-4 max-w-xl">
      <p className="text-sm text-slate-500">
        Members enter this access code in the app to join your organization.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-950 text-white font-mono text-lg tracking-[0.25em]">
        {loading ? (
          <span className="text-sm tracking-normal font-sans text-slate-400">Loading…</span>
        ) : (
          joinCode || "--------"
        )}
        <button
          type="button"
          className="text-xs tracking-normal font-sans text-teal-300 disabled:opacity-40"
          onClick={copy}
          disabled={!joinCode}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <button
        onClick={rotate}
        disabled={busy || loading}
        className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm inline-flex items-center gap-2 disabled:opacity-60"
      >
        {busy && <Loader2 size={14} className="animate-spin" />}
        {joinCode ? "Generate new access code" : "Generate access code"}
      </button>
    </div>
  );
}
