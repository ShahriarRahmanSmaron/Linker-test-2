import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Building2, Mail, Shield, User, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface UserData {
  id: number;
  email: string;
  role: string;
  company_name: string | null;
  approval_status: string;
  is_verified_buyer: boolean;
  has_supabase_uid: boolean;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [roleFilter, setRoleFilter] = useState<'all' | 'manufacturer' | 'buyer' | 'general_user'>('manufacturer');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = '/admin/users?';
      if (filter !== 'all') {
        url += `approval_status=${filter}&`;
      }
      if (roleFilter !== 'all') {
        url += `role=${roleFilter}`;
      }
      
      const response = await api.get(url);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter, roleFilter]);

  const handleApprove = async (userId: number) => {
    setActionLoading(userId);
    try {
      const response = await api.post(`/admin/user/${userId}/approve`, {});
      if (response.ok) {
        toast.success('Manufacturer approved successfully');
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.msg || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Error approving user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: number) => {
    setActionLoading(userId);
    try {
      const response = await api.post(`/admin/user/${userId}/reject`, {});
      if (response.ok) {
        toast.success('Manufacturer rejected');
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.msg || 'Failed to reject user');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Error rejecting user');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'pending': { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200' },
      'approved': { label: 'Approved', className: 'bg-green-100 text-green-700 border-green-200' },
      'rejected': { label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-200' },
      'none': { label: 'N/A', className: 'bg-neutral-100 text-neutral-500 border-neutral-200' }
    };
    
    const config = statusConfig[status] || statusConfig['none'];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      'manufacturer': { 
        label: 'Manufacturer', 
        icon: <Building2 className="w-3 h-3" />,
        className: 'bg-green-50 text-green-700 border-green-200' 
      },
      'buyer': { 
        label: 'Buyer', 
        icon: <User className="w-3 h-3" />,
        className: 'bg-blue-50 text-blue-700 border-blue-200' 
      },
      'general_user': { 
        label: 'General', 
        icon: <User className="w-3 h-3" />,
        className: 'bg-neutral-50 text-neutral-600 border-neutral-200' 
      },
      'admin': { 
        label: 'Admin', 
        icon: <Shield className="w-3 h-3" />,
        className: 'bg-red-50 text-red-700 border-red-200' 
      }
    };
    
    const config = roleConfig[role] || roleConfig['general_user'];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.company_name && user.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">User Management</h1>
          <p className="text-neutral-500">Manage user accounts and manufacturer approvals</p>
        </div>
        <Button onClick={fetchUsers} variant="outline" className="flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by email or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className="px-4 py-2 border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Roles</option>
          <option value="manufacturer">Manufacturers</option>
          <option value="buyer">Buyers</option>
          <option value="general_user">General Users</option>
        </select>

        {/* Status Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="px-4 py-2 border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-700">
                {users.filter(u => u.approval_status === 'pending').length}
              </p>
              <p className="text-sm text-amber-600">Pending Approval</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-700">
                {users.filter(u => u.role === 'manufacturer' && u.approval_status === 'approved').length}
              </p>
              <p className="text-sm text-green-600">Approved Manufacturers</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {users.filter(u => u.role === 'buyer').length}
              </p>
              <p className="text-sm text-blue-600">Verified Buyers</p>
            </div>
          </div>
        </Card>
      </div>

      {/* User List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-neutral-500">No users found matching your criteria</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="p-4 bg-white border border-neutral-200 hover:border-neutral-300 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* User Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user.approval_status)}
                    {user.is_verified_buyer && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                        Verified Domain
                      </span>
                    )}
                    {user.has_supabase_uid && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                        Supabase User
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-900">{user.email}</span>
                  </div>
                  
                  {user.company_name && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm text-neutral-600">{user.company_name}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {user.role === 'manufacturer' && user.approval_status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(user.id)}
                      disabled={actionLoading === user.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {actionLoading === user.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleReject(user.id)}
                      disabled={actionLoading === user.id}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
                
                {user.role === 'manufacturer' && user.approval_status === 'rejected' && (
                  <Button
                    onClick={() => handleApprove(user.id)}
                    disabled={actionLoading === user.id}
                    variant="outline"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Re-approve
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

