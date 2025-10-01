'use client';
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronRight, Edit, Trash2, Phone, MapPin, Building, Shield, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import EditUserModal from "./edit-user-modal";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phone: string | null;
  mobile: string | null;
  extension: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  image: string | null;
  createdAt?: string;
  userDepartments?: Array<{
    id: string;
    jobPosition: string;
    isManager: boolean;
    department: {
      id: string;
      name: string;
      description: string | null;
    };
  }>;
}

export default function UserManagementTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.users) {
          setUsers(data.users);
        } else {
          console.error('Invalid response format:', data);
          setUsers([]);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRow = (userId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  const expandAll = () => {
    setExpandedRows(new Set(users.map(user => user.id)));
  };

  const collapseAll = () => {
    setExpandedRows(new Set());
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setUsers(users.filter(user => user.id !== userId));
          setExpandedRows(new Set([...expandedRows].filter(id => id !== userId)));
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMINISTRATOR':
        return 'bg-red-100 text-red-800';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'EMPLOYEE':
        return 'bg-green-100 text-green-800';
      case 'COLLABORATOR':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading users...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {users.length} users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="h-8 px-3 text-sm"
            >
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="h-8 px-3 text-sm"
            >
              Collapse All
            </Button>
            <div className="text-sm text-gray-600 ml-4">
              {expandedRows.size} row{expandedRows.size !== 1 ? 's' : ''} expanded
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {users.map((user) => {
            const isExpanded = expandedRows.has(user.id);
            const hasDepartments = (user.userDepartments?.length ?? 0) > 0;
            
            return (
              <div key={user.id} className="border rounded-lg overflow-hidden">
                {/* Header Row */}
                <div className={cn(
                  "flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer",
                  isExpanded && "bg-blue-50 border-b border-blue-200"
                )} onClick={() => toggleRow(user.id)}>
                  <div className="flex items-center gap-4 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-blue-100 text-blue-600"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {getUserInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{user.name || 'No name'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(user);
                        }}
                        className="h-8 px-3 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(user.id);
                        }}
                        className="h-8 px-3 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="bg-gray-50 p-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Contact Information */}
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Phone className="h-4 w-4 text-blue-600" />
                          Contact Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Office Phone:</span>
                            <span className="text-gray-900">{user.phone || 'Not provided'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Mobile:</span>
                            <span className="text-gray-900">{user.mobile || 'Not provided'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Extension:</span>
                            <span className="text-gray-900">{user.extension || 'Not provided'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Address Information */}
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          Address Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Address:</span>
                            <span className="text-gray-900 max-w-xs text-right">{user.address || 'Not provided'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">City:</span>
                            <span className="text-gray-900">{user.city || 'Not provided'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">ZIP:</span>
                            <span className="text-gray-900">{user.zip || 'Not provided'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Country:</span>
                            <span className="text-gray-900">{user.country || 'Not provided'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Department Details */}
                      <div className="md:col-span-2 lg:col-span-1 bg-white p-4 rounded-lg border">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Building className="h-4 w-4 text-purple-600" />
                          Department Details
                        </h4>
                        {hasDepartments ? (
                          <div className="space-y-3">
                            {user.userDepartments?.map((userDept) => (
                              <div key={userDept.id} className="p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {userDept.department.name}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {userDept.jobPosition}
                                    </div>
                                  </div>
                                  {userDept.isManager && (
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                                      Manager
                                    </Badge>
                                  )}
                                </div>
                                {userDept.department.description && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {userDept.department.description}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm">No department assignments</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </>
  );
}
