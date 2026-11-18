import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  UsersIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  KeyIcon,
  TrashIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const PERMISSION_CONFIG = [
  { key: 'viewAllLeads', label: 'View All CRM Leads', desc: 'If unchecked, employee can ONLY see leads assigned to them (Strict Privacy).' },
  { key: 'editLeads', label: 'Edit & Update Leads', desc: 'Allows modifying client details, stages, notes, and profile data.' },
  { key: 'deleteLeads', label: 'Delete Leads', desc: 'Allows permanently deleting leads from the pipeline.' },
  { key: 'exportLeads', label: 'Export Leads to CSV', desc: 'Allows downloading lead contact lists to spreadsheet files.' },
  { key: 'viewFinancials', label: 'View Financial / Deal Values', desc: 'Displays revenue, fee values, and deal sizes in the table and pipeline.' },
  { key: 'manageFollowUps', label: 'Manage Follow-ups & Reminders', desc: 'Allows scheduling, snoozing, and logging client calls.' },
  { key: 'accessAutomations', label: 'Workflow Rules & Email Templates', desc: 'Allows viewing and configuring background automation rules.' },
  { key: 'accessSettings', label: 'Access System Settings', desc: 'Grants access to general CRM settings and profile preferences.' },
];

export default function Employees() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [teamList, setTeamList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditPermissionsModalOpen, setIsEditPermissionsModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // New Employee Form
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [showNewEmpPassword, setShowNewEmpPassword] = useState(false);
  const [creatingEmployee, setCreatingEmployee] = useState(false);
  const [newEmpPermissions, setNewEmpPermissions] = useState({
    viewAllLeads: false, // default false = only assigned leads!
    editLeads: true,
    deleteLeads: false,
    exportLeads: false,
    viewFinancials: false,
    manageFollowUps: true,
    accessAutomations: false,
    accessSettings: false,
  });

  // Edit Permissions State
  const [editingPermissions, setEditingPermissions] = useState({});
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Reset Password State
  const [resetEmpPassword, setResetEmpPassword] = useState('');
  const [showResetEmpPassword, setShowResetEmpPassword] = useState(false);
  const [savingResetPass, setSavingResetPass] = useState(false);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users');
      if (res.data?.success) {
        setTeamList(res.data.users || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const filteredTeam = useMemo(() => {
    return teamList.filter(emp => {
      if (statusFilter === 'active' && emp.isActive === false) return false;
      if (statusFilter === 'disabled' && emp.isActive !== false) return false;
      if (statusFilter === 'staff' && emp.role !== 'staff') return false;
      if (statusFilter === 'admin' && emp.role !== 'admin') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = emp.name?.toLowerCase().includes(q);
        const matchEmail = emp.email?.toLowerCase().includes(q);
        if (!matchName && !matchEmail) return false;
      }
      return true;
    });
  }, [teamList, statusFilter, searchQuery]);

  const handleCreateEmployee = async (e) => {
    if (e) e.preventDefault();
    if (!newEmpName.trim()) return toast.error('Employee name is required');
    if (!newEmpEmail.trim()) return toast.error('Employee email is required');
    if (!newEmpPassword.trim() || newEmpPassword.trim().length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setCreatingEmployee(true);
    const tId = toast.loading('Creating employee account...');
    try {
      const res = await api.post('/auth/create-employee', {
        name: newEmpName.trim(),
        email: newEmpEmail.trim(),
        password: newEmpPassword.trim(),
        permissions: newEmpPermissions
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Employee created successfully!', { id: tId });
        setIsAddModalOpen(false);
        setNewEmpName('');
        setNewEmpEmail('');
        setNewEmpPassword('');
        setNewEmpPermissions({
          viewAllLeads: false,
          editLeads: true,
          deleteLeads: false,
          exportLeads: false,
          viewFinancials: false,
          manageFollowUps: true,
          accessAutomations: false,
          accessSettings: false,
        });
        fetchTeamMembers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create employee', { id: tId });
    } finally {
      setCreatingEmployee(false);
    }
  };

  const handleOpenEditPermissions = (employee) => {
    setSelectedEmployee(employee);
    setEditingPermissions({
      viewAllLeads: false,
      editLeads: true,
      deleteLeads: false,
      exportLeads: false,
      viewFinancials: false,
      manageFollowUps: true,
      accessAutomations: false,
      accessSettings: false,
      ...(employee.permissions || {})
    });
    setIsEditPermissionsModalOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedEmployee) return;
    setSavingPermissions(true);
    const tId = toast.loading('Saving permissions...');
    try {
      const res = await api.put(`/auth/users/${selectedEmployee._id}`, {
        permissions: editingPermissions
      });
      if (res.data?.success) {
        toast.success(`Permissions updated for ${selectedEmployee.name}!`, { id: tId });
        setIsEditPermissionsModalOpen(false);
        fetchTeamMembers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save permissions', { id: tId });
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleOpenResetPassword = (employee) => {
    setSelectedEmployee(employee);
    setResetEmpPassword('');
    setIsResetPassModalOpen(true);
  };

  const handleSaveResetPassword = async () => {
    if (!selectedEmployee) return;
    if (!resetEmpPassword.trim() || resetEmpPassword.trim().length < 6) {
      return toast.error('New password must be at least 6 characters');
    }
    setSavingResetPass(true);
    const tId = toast.loading('Updating employee password...');
    try {
      const res = await api.put(`/auth/users/${selectedEmployee._id}`, {
        password: resetEmpPassword.trim()
      });
      if (res.data?.success) {
        toast.success(`Password updated for ${selectedEmployee.name}! They can now log in with this new password.`, { id: tId });
        setIsResetPassModalOpen(false);
        setResetEmpPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update employee password', { id: tId });
    } finally {
      setSavingResetPass(false);
    }
  };

  const handleDeleteEmployee = async (employee) => {
    if (!window.confirm(`Are you sure you want to permanently delete employee '${employee.name}'? All leads assigned to them will automatically become unassigned.`)) {
      return;
    }
    const tId = toast.loading('Deleting employee...');
    try {
      const res = await api.delete(`/auth/users/${employee._id}`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Employee deleted', { id: tId });
        fetchTeamMembers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete employee', { id: tId });
    }
  };

  const handleToggleActive = async (employee) => {
    const tId = toast.loading(employee.isActive ? 'Deactivating employee...' : 'Activating employee...');
    try {
      const res = await api.put(`/auth/users/${employee._id}`, {
        isActive: !employee.isActive
      });
      if (res.data?.success) {
        toast.success(`Employee ${employee.isActive ? 'deactivated' : 'activated'}`, { id: tId });
        fetchTeamMembers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update employee status', { id: tId });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-30 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">Employees &amp; Staff</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {teamList.length} Team Members
            </span>
          </div>
          <p className="text-slate-500 font-medium text-[13px] mt-1">
            Create employee login accounts, assign permissions, and control lead access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTeamMembers}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all"
            title="Refresh"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[13px] font-bold shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <UserPlusIcon className="w-4 h-4 stroke-[2.2]" />
            <span>+ Add Employee</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="px-6 py-3.5 bg-slate-50/70 border-b border-slate-200 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-5xl">
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Accounts</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{teamList.length}</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-blue-200/80 shadow-2xs">
            <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Staff Employees</p>
            <p className="text-2xl font-black text-blue-700 mt-1">
              {teamList.filter(u => u.role === 'staff').length}
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active Staff</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {teamList.filter(u => u.isActive !== false).length}
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-purple-200/80 shadow-2xs">
            <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Total Assigned Leads</p>
            <p className="text-2xl font-black text-purple-700 mt-1">
              {teamList.reduce((acc, u) => acc + (u.assignedLeadCount || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative group w-full sm:w-72">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-[13px] font-medium focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-400 outline-none w-full transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="all">Role: All Accounts</option>
            <option value="staff">Staff Employees Only</option>
            <option value="admin">Admins Only</option>
            <option value="active">Active Only</option>
            <option value="disabled">Disabled Only</option>
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <ArrowPathIcon className="w-7 h-7 animate-spin text-indigo-600" />
              <span className="text-sm font-semibold">Loading employees...</span>
            </div>
          ) : filteredTeam.length === 0 ? (
            <div className="py-20 text-center">
              <UserGroupIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No employees found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery ? 'No employees match your search query.' : 'Click "+ Add Employee" above to create your first employee login.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-5">Employee</th>
                    <th className="py-3 px-5">Role</th>
                    <th className="py-3 px-5">Assigned Leads</th>
                    <th className="py-3 px-5">Dashboard Permissions</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {filteredTeam.map((emp) => {
                    const isEmpAdmin = emp.role === 'admin';
                    const isSelf = String(emp._id) === String(user?._id);
                    const perms = emp.permissions || {};

                    return (
                      <tr key={emp._id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Employee Info */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                              {emp.name ? emp.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 truncate">{emp.name}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    You (Admin)
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400 font-medium truncate">{emp.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                            isEmpAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {emp.role}
                          </span>
                        </td>

                        {/* Assigned Leads */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/leads?assignedTo=${emp._id}`)}
                            title="Click to view this employee's leads in pipeline"
                            className="font-bold text-slate-800 hover:text-indigo-600 flex items-center gap-1.5 group cursor-pointer"
                          >
                            <span>{emp.assignedLeadCount || 0} leads</span>
                            <span className="text-[11px] text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              &rarr;
                            </span>
                          </button>
                        </td>

                        {/* Permissions Overview */}
                        <td className="py-3.5 px-5 max-w-sm">
                          {isEmpAdmin ? (
                            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                              Full Administrator Access
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                                perms.viewAllLeads 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {perms.viewAllLeads ? '👁️ All Leads' : '🔒 Assigned Only'}
                              </span>
                              {perms.editLeads && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                                  ✏️ Edit
                                </span>
                              )}
                              {perms.deleteLeads && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                  🗑️ Delete
                                </span>
                              )}
                              {perms.exportLeads && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700">
                                  📥 Export
                                </span>
                              )}
                              {perms.viewFinancials && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded font-semibold bg-green-50 text-green-700">
                                  💰 Financials
                                </span>
                              )}
                              {perms.manageFollowUps && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                                  ⏰ Follow-ups
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Status Toggle */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <button
                            onClick={() => !isSelf && handleToggleActive(emp)}
                            disabled={isSelf}
                            title={isSelf ? 'Cannot deactivate yourself' : 'Click to toggle status'}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                              emp.isActive !== false
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            } ${isSelf ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {emp.isActive !== false ? 'Active' : 'Disabled'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isEmpAdmin && (
                              <button
                                onClick={() => handleOpenEditPermissions(emp)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer"
                                title="Edit Permissions"
                              >
                                <ShieldCheckIcon className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenResetPassword(emp)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-200 transition-all cursor-pointer"
                              title="Reset Employee Password"
                            >
                              <KeyIcon className="w-4 h-4" />
                            </button>

                            {!isSelf && (
                              <button
                                onClick={() => handleDeleteEmployee(emp)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                                title="Delete Employee Account"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD EMPLOYEE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UserPlusIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Employee Account</h3>
                  <p className="text-xs text-slate-500">Set login credentials and choose dashboard permissions.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Work Email Address (For Login) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@reform.com"
                  value={newEmpEmail}
                  onChange={(e) => setNewEmpEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Login Password (Given by Admin) *
                </label>
                <div className="relative">
                  <input
                    type={showNewEmpPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Set employee password (e.g. Rahul@123)"
                    value={newEmpPassword}
                    onChange={(e) => setNewEmpPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewEmpPassword(!showNewEmpPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewEmpPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Admin will share this email &amp; password with employee to log in.
                </p>
              </div>

              {/* Permissions Grid */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2.5">
                  Select Permissions for Employee Dashboard
                </label>
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {PERMISSION_CONFIG.map((p) => {
                    const checked = Boolean(newEmpPermissions[p.key]);
                    return (
                      <label
                        key={p.key}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          checked 
                            ? 'bg-indigo-50/50 border-indigo-200' 
                            : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setNewEmpPermissions({
                            ...newEmpPermissions,
                            [p.key]: e.target.checked
                          })}
                          className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-[13px] font-bold text-slate-900 leading-snug">
                            {p.label}
                          </span>
                          <span className="text-[11px] text-slate-500 leading-snug mt-0.5">
                            {p.desc}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingEmployee}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {creatingEmployee && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                  <span>{creatingEmployee ? 'Creating Account...' : 'Create Employee Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PERMISSIONS */}
      {isEditPermissionsModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Permissions: {selectedEmployee.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Control which features and leads this employee can see.
                </p>
              </div>
              <button 
                onClick={() => setIsEditPermissionsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 my-5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {PERMISSION_CONFIG.map((p) => {
                const checked = Boolean(editingPermissions[p.key]);
                return (
                  <label
                    key={p.key}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      checked 
                        ? 'bg-indigo-50/50 border-indigo-200' 
                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setEditingPermissions({
                        ...editingPermissions,
                        [p.key]: e.target.checked
                      })}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-[13px] font-bold text-slate-900 leading-snug">
                        {p.label}
                      </span>
                      <span className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        {p.desc}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditPermissionsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingPermissions}
                onClick={handleSavePermissions}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all disabled:opacity-50 cursor-pointer"
              >
                {savingPermissions && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                <span>{savingPermissions ? 'Saving...' : 'Save Permissions'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET PASSWORD FOR EMPLOYEE */}
      {isResetPassModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <KeyIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reset Employee Password</h3>
                  <p className="text-xs text-slate-500">Set a new password for {selectedEmployee.name}.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsResetPassModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Password (Set by Admin) *
                </label>
                <div className="relative">
                  <input
                    type={showResetEmpPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Enter new employee password"
                    value={resetEmpPassword}
                    onChange={(e) => setResetEmpPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetEmpPassword(!showResetEmpPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showResetEmpPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  After updating, share this new password with the employee so they can log in.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetPassModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingResetPass}
                onClick={handleSaveResetPassword}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition-all disabled:opacity-50 cursor-pointer"
              >
                {savingResetPass && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                <span>{savingResetPass ? 'Updating...' : 'Set New Password'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
