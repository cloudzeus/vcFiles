'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Check, Plus, Upload, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

interface Department {
  id: string;
  name: string;
  description: string | null;
}

interface DepartmentRole {
  id: string;
  name: string;
  description: string | null;
  level: number;
}

interface EditUserModalProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: (user: User) => void;
}

// Common countries list
const COUNTRIES = [
  'USA', 'Canada', 'UK', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands',
  'Belgium', 'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland',
  'Poland', 'Czech Republic', 'Hungary', 'Slovakia', 'Slovenia', 'Croatia',
  'Serbia', 'Bulgaria', 'Romania', 'Greece', 'Turkey', 'Ukraine', 'Russia',
  'Japan', 'China', 'South Korea', 'India', 'Australia', 'New Zealand',
  'Brazil', 'Argentina', 'Chile', 'Mexico', 'South Africa', 'Egypt', 'Nigeria'
];

// User roles
const USER_ROLES = [
  { value: 'ADMINISTRATOR', label: 'Administrator' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'COLLABORATOR', label: 'Collaborator' }
];

export default function EditUserModal({ user, open, onOpenChange, onUserUpdated }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    mobile: user.mobile || '',
    extension: user.extension || '',
    address: user.address || '',
    city: user.city || '',
    zip: user.zip || '',
    country: user.country || '',
    image: user.image || ''
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentRoles, setDepartmentRoles] = useState<DepartmentRole[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<Array<{
    departmentId: string;
    roleId: string;
    jobPosition: string;
    isManager: boolean;
  }>>(user.userDepartments?.map(ud => ({
    departmentId: ud.department.id,
    roleId: '', // We'll need to map this from department roles
    jobPosition: ud.jobPosition,
    isManager: ud.isManager
  })) || []);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newDepartmentRole, setNewDepartmentRole] = useState({
    departmentId: '',
    roleId: '',
    jobPosition: '',
    isManager: false
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      fetchDepartments();
      fetchDepartmentRoles();
      setAvatarPreview(user.image);
      setSelectedFile(null);
    }
  }, [open, user.image]);

  // Update form data when user changes
  useEffect(() => {
    setFormData({
      name: user.name || '',
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      mobile: user.mobile || '',
      extension: user.extension || '',
      address: user.address || '',
      city: user.city || '',
      zip: user.zip || '',
      country: user.country || '',
      image: user.image || ''
    });
  }, [user]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDepartmentRoles = async () => {
    try {
      const response = await fetch('/api/department-roles');
      if (response.ok) {
        const data = await response.json();
        setDepartmentRoles(data.roles);
      }
    } catch (error) {
      console.error('Error fetching department roles:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!selectedFile) return formData.image;

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', selectedFile);
      formDataUpload.append('path', 'avatars');

      const response = await fetch('/api/cdn/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      const cdnUrl = result.cdnUrl;
      
      toast.success('Avatar uploaded successfully!');
      return cdnUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload avatar');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const removeAvatar = () => {
    setSelectedFile(null);
    setAvatarPreview(null);
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const addDepartmentRole = () => {
    if (newDepartmentRole.departmentId && newDepartmentRole.jobPosition) {
      setSelectedDepartments(prev => [...prev, { ...newDepartmentRole }]);
      setNewDepartmentRole({
        departmentId: '',
        roleId: '',
        jobPosition: '',
        isManager: false
      });
    }
  };

  const removeDepartmentRole = (index: number) => {
    setSelectedDepartments(prev => prev.filter((_, i) => i !== index));
  };

  const updateDepartmentRole = (index: number, field: string, value: any) => {
    setSelectedDepartments(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Upload avatar first if there's a new file
      let avatarUrl: string | null = formData.image;
      if (selectedFile) {
        const uploadedUrl = await uploadAvatar();
        if (!uploadedUrl) {
          setIsLoading(false);
          return;
        }
        avatarUrl = uploadedUrl;
      }

      // Debug: Log what we're sending to the API
      const requestBody = {
        ...formData,
        image: avatarUrl,
        userDepartments: selectedDepartments
      };
      console.log('Form data state before submission:', formData);
      console.log('Sending to API:', requestBody);
      
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        // Refresh user data to get the latest information
        try {
          const refreshResponse = await fetch('/api/users/me');
          if (refreshResponse.ok) {
            const freshData = await refreshResponse.json();
            onUserUpdated(freshData.user);
          } else {
            onUserUpdated(updatedUser.user);
          }
        } catch (refreshError) {
          console.error('Error refreshing user data:', refreshError);
          onUserUpdated(updatedUser.user);
        }
        
        toast.success('User updated successfully!');
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('An error occurred while updating the user');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User: {user.name || user.email}</DialogTitle>
          <DialogDescription>
            Update user information, contact details, and department assignments
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || undefined} alt={user.name || user.email} />
                <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
                
                {avatarPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeAvatar}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <p className="text-xs text-gray-500 text-center">
                JPG, PNG, GIF up to 5MB
              </p>
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-2">Profile Picture</h3>
              <p className="text-sm text-gray-600">
                Upload a profile picture for this user. The image will be automatically resized and optimized.
              </p>
              {selectedFile && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                  <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="phone">Office Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter office phone"
                />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  placeholder="Enter mobile number"
                />
              </div>
              <div>
                <Label htmlFor="extension">Extension</Label>
                <Input
                  id="extension"
                  value={formData.extension}
                  onChange={(e) => handleInputChange('extension', e.target.value)}
                  placeholder="Enter extension"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter street address"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="zip">ZIP/Postal Code</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => handleInputChange('zip', e.target.value)}
                  placeholder="Enter ZIP code"
                />
              </div>
            </div>
          </div>

          {/* Department Assignments */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Department Assignments</h3>
            
            {/* Current Assignments */}
            {selectedDepartments.length > 0 && (
              <div className="space-y-3 mb-4">
                {selectedDepartments.map((deptRole, index) => {
                  const department = departments.find(d => d.id === deptRole.departmentId);
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs text-gray-600">Department</Label>
                          <Select 
                            value={deptRole.departmentId} 
                            onValueChange={(value) => updateDepartmentRole(index, 'departmentId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Job Position</Label>
                          <Input
                            value={deptRole.jobPosition}
                            onChange={(e) => updateDepartmentRole(index, 'jobPosition', e.target.value)}
                            placeholder="Job position"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`manager-${index}`}
                            checked={deptRole.isManager}
                            onChange={(e) => updateDepartmentRole(index, 'isManager', e.target.checked)}
                            className="rounded"
                          />
                          <Label htmlFor={`manager-${index}`} className="text-sm">Manager</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDepartmentRole(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add New Assignment */}
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Add New Department Assignment</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">Department</Label>
                  <Select 
                    value={newDepartmentRole.departmentId} 
                    onValueChange={(value) => setNewDepartmentRole(prev => ({ ...prev, departmentId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Job Position</Label>
                  <Input
                    value={newDepartmentRole.jobPosition}
                    onChange={(e) => setNewDepartmentRole(prev => ({ ...prev, jobPosition: e.target.value }))}
                    placeholder="Job position"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="new-manager"
                    checked={newDepartmentRole.isManager}
                    onChange={(e) => setNewDepartmentRole(prev => ({ ...prev, isManager: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="new-manager" className="text-sm">Manager</Label>
                </div>
                <div>
                  <Button
                    type="button"
                    onClick={addDepartmentRole}
                    className="w-full"
                    disabled={!newDepartmentRole.departmentId || !newDepartmentRole.jobPosition}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isUploading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update User'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
