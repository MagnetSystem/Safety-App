import QueryError from '../../components/QueryError';
import type { Organization } from '../../types/organization';
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../context/auth";
import { canAddOrgAdmins, canManageOrgTeam } from "../../types/user";
import { changePassword, updateMyProfile } from "../../services/authService";
import {
  getJoinCode,
  getMyOrganization,
  rotateJoinCode,
  updateMyOrgSettings,
  updateMyOrganization,
} from "../../services/organizationsService";
import { queryKeys } from "../../lib/queryKeys";

type Tab = "account" | "organization" | "features" | "access";

export default function Settings() {
  const { user, role, updateLocalUser } = useAuth();
  const [tab, setTab] = useState<Tab>("account");
  const canOrg = canManageOrgTeam(role);
  const canFeatures = canAddOrgAdmins(role);

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "account", label: "My account", show: true },
    { id: "organization", label: "Organization", show: canOrg },
    { id: "features", label: "Safety features", show: canFeatures },
    { id: "access", label: "Join & access", show: canOrg },
  ];

  return (
    <div className="page-shell">
      <div className="section-intro">
        <p className="page-overline">Settings</p>
        <h1>Account & organization</h1>
        <p>Manage how you sign in and how this tenant is set up.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.filter((t) => t.show).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-11 rounded-full px-4 text-sm font-medium ${tab === t.id ? "bg-teal-600 text-white" : "bg-white border border-border text-slate-600"}`}
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
    if (saving || !displayName.trim()) return;
    setMessage("");
    setError("");
    setSaving(true);
    try {
      await updateMyProfile({ name: displayName.trim() });
      onNameSaved?.(displayName.trim());
      setMessage("Name saved.");
    } catch {
      setError("Could not save name.");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (saving || !currentPassword) return;
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
    } catch {
      setError("Could not change password.");
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
            <button onClick={saveName} disabled={saving} className="rounded-xl bg-teal-600 px-4 py-2 text-sm text-white">
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
  const queryClient = useQueryClient();
  const { data: orgData, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.organizations.me,
    queryFn: getMyOrganization,
  });
  const [org, setOrg] = useState<Organization | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (orgData) setOrg(orgData);
  }, [orgData]);

  if (isError) return <QueryError message="Unable to load organization." retry={refetch} />;
  if (isLoading || !org) {
    return <div className="text-sm text-slate-500">{isError || error ? "Could not load organization." : "Loading…"}</div>;
  }

  const save = async () => {
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      const updated = await updateMyOrganization({
        name: org.name,
        address: org.address ?? "",
        state: org.state ?? "",
        district: org.district ?? "",
        principal: org.contactName ?? "",
        phone: org.phone ?? "",
        email: org.email ?? "",
      });
      setOrg(updated);
      queryClient.setQueryData(queryKeys.organizations.me, updated);
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
      {(["name", "contactName", "phone", "email", "address", "state", "district"] as const).map((key) => (
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
  const queryClient = useQueryClient();
  const { data: orgData, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.organizations.me,
    queryFn: getMyOrganization,
  });
  const [settings, setSettings] = useState<(Record<string, unknown> & { features?: Record<string, boolean> }) | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (orgData) setSettings(orgData.settings ?? {});
  }, [orgData]);

  if (isError) return <QueryError message="Unable to load safety features." retry={refetch} />;
  if (isLoading || !settings) return <div className="text-sm text-slate-500">Loading…</div>;

  const features = settings.features ?? {};
  const toggle = (key: string) =>
    setSettings({ ...settings, features: { ...features, [key]: !features[key] } });

  const save = async () => {
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      await updateMyOrgSettings(settings);
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.me });
    } catch {
      setError("Unable to save safety features. Your changes are preserved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="surface-card p-5 space-y-3 max-w-xl">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
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
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState("");
  const [copied, setCopied] = useState(false);

  const { data, isLoading: loading, isError } = useQuery({
    queryKey: queryKeys.organizations.joinCode,
    queryFn: async () => {
      try {
        return await getJoinCode();
      } catch {
        const org = await getMyOrganization();
        return { id: org.id, joinCode: org.joinCode ?? "" };
      }
    },
  });
  const joinCode = (data?.joinCode ?? "").toUpperCase();
  const error = actionError || (isError ? "Could not load the join code." : "");

  const rotateMutation = useMutation({
    mutationFn: rotateJoinCode,
    onSuccess: (res) => {
      const next = (res.joinCode ?? "").toUpperCase();
      if (!next) {
        setActionError("The server did not return an access code. Try again.");
        return;
      }
      queryClient.setQueryData(queryKeys.organizations.joinCode, res);
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.me });
    },
    onError: () => {
      setActionError("Could not generate the access code.");
    },
  });
  const busy = rotateMutation.isPending;

  const rotate = async () => {
    if (busy) return;
    setCopied(false);
    setActionError("");
    if (joinCode && !window.confirm("The old code will stop working immediately. Generate a new one?")) return;
    rotateMutation.mutate();
  };

  const copy = async () => {
    if (!joinCode) return;
    try { await navigator.clipboard.writeText(joinCode); setCopied(true); }
    catch { setActionError("Unable to copy. Select and copy the code manually."); }
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
