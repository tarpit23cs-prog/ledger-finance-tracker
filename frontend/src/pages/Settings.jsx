import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ name: user?.name || "" });
  const [prefs, setPrefs] = useState({
    currency: user?.currency || "INR",
    theme: user?.theme || "light",
    budgetAlerts: user?.budgetAlerts ?? true,
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authApi.updateMe(profile);
      updateUser(res.data.user);
      showToast("Profile updated", "success");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const savePrefs = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authApi.updateMe(prefs);
      updateUser(res.data.user);
      showToast("Preferences saved", "success");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showToast("Both password fields are required", "error");
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword(passwordForm);
      showToast("Password updated", "success");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, security, and preferences" />

      <div className="grid grid-2 mb-4">
        <div className="card">
          <div className="card-title">Profile</div>
          <form onSubmit={saveProfile}>
            <div className="field">
              <label>Name</label>
              <input
                className="input"
                value={profile.name}
                onChange={(e) => setProfile({ name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" value={user?.email || ""} disabled />
            </div>
            <button className="btn btn-primary" disabled={saving}>
              Save profile
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Security</div>
          <form onSubmit={changePassword}>
            <div className="field">
              <label>Current password</label>
              <input
                type="password"
                className="input"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>New password</label>
              <input
                type="password"
                className="input"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
              />
            </div>
            <button className="btn btn-primary" disabled={saving}>
              Change password
            </button>
          </form>
          <button className="btn btn-ghost mt-4" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Preferences</div>
        <form onSubmit={savePrefs}>
          <div className="grid grid-3">
            <div className="field">
              <label>Currency</label>
              <select
                className="select"
                value={prefs.currency}
                onChange={(e) => setPrefs((f) => ({ ...f, currency: e.target.value }))}
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="field">
              <label>Theme</label>
              <select
                className="select"
                value={prefs.theme}
                onChange={(e) => setPrefs((f) => ({ ...f, theme: e.target.value }))}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div className="field">
              <label>Budget alerts</label>
              <div className="checkbox-row" style={{ marginTop: 9 }}>
                <input
                  type="checkbox"
                  id="budgetAlerts"
                  checked={prefs.budgetAlerts}
                  onChange={(e) => setPrefs((f) => ({ ...f, budgetAlerts: e.target.checked }))}
                />
                <label htmlFor="budgetAlerts">Notify when a budget is exceeded</label>
              </div>
            </div>
          </div>
          <button className="btn btn-primary" disabled={saving}>
            Save preferences
          </button>
        </form>
      </div>
    </div>
  );
}
