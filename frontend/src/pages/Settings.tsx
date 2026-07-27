import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Shield, Bell, Database, Users, Key, Globe, Save, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';

export default function Settings() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('system');

  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    companyName: 'TradeFlow Nexus',
    companyAddress: '123 Financial District, New York, NY 10001',
    timeFormat: '24h',
    dateFormat: 'dd/mm/yyyy',
    currency: 'USD',
    language: 'en',
    timezone: 'America/New_York',
    maintenanceMode: false,
    debugMode: false,
    emailVerificationRequired: true,
    twoFactorRequired: false,
    sessionTimeout: '30',
    maxLoginAttempts: '5'
  });

  // User management state
  const [users, setUsers] = useState([
    { id: '1', name: 'John Doe', email: 'john@whizunik.com', role: 'Administrator', status: 'Active', lastLogin: '2026-01-05 09:30' },
    { id: '2', name: 'Jane Smith', email: 'jane@whizunik.com', role: 'Manager', status: 'Active', lastLogin: '2026-01-04 14:20' },
    { id: '3', name: 'Bob Johnson', email: 'bob@whizunik.com', role: 'Analyst', status: 'Inactive', lastLogin: '2026-01-02 11:15' },
  ]);

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: '8',
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    accountLockoutEnabled: true,
    accountLockoutThreshold: '5',
    accountLockoutDuration: '30',
    ipWhitelistEnabled: false,
    apiRateLimitEnabled: true,
    apiRateLimit: '1000',
    auditLogRetention: '90'
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    smsEnabled: false,
    slackEnabled: false,
    webhookEnabled: false,
    transactionNotifications: true,
    riskAlertNotifications: true,
    systemMaintenanceNotifications: true,
    reportNotifications: false,
    defaultEmailTemplate: 'standard',
    emailSmtpServer: 'smtp.company.com',
    emailSmtpPort: '587',
    slackWebhook: '',
    webhookUrl: ''
  });

  // Data management state
  const [dataSettings, setDataSettings] = useState({
    dataRetentionPeriod: '7',
    backupFrequency: 'daily',
    backupRetention: '30',
    exportFormat: 'csv',
    compressionEnabled: true,
    encryptionEnabled: true,
    anonymizeExports: false,
    auditTrailEnabled: true
  });

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Analyst',
    sendWelcomeEmail: true
  });

  const handleSystemSettingsSave = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('System settings saved:', systemSettings);
    } catch (error) {
      console.error('Error saving system settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = () => {
    const newUserWithId = {
      id: (users.length + 1).toString(),
      ...newUser,
      status: 'Active',
      lastLogin: 'Never'
    };
    setUsers([...users, newUserWithId]);
    setNewUser({ name: '', email: '', role: 'Analyst', sendWelcomeEmail: true });
    setShowAddUser(false);
  };

  const handleUserStatusToggle = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' }
        : user
    ));
  };

  const handleSecuritySettingsSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Security settings saved:', securitySettings);
    } catch (error) {
      console.error('Error saving security settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSettingsSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Notification settings saved:', notificationSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDataSettingsSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Data settings saved:', dataSettings);
    } catch (error) {
      console.error('Error saving data settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure system settings and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="system">
            <Globe className="w-4 h-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="w-4 h-4 mr-2" />
            Data & Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Configure general system settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Company Information</h4>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={systemSettings.companyName}
                      onChange={(e) => setSystemSettings({ ...systemSettings, companyName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Company Address</Label>
                    <Input
                      id="companyAddress"
                      value={systemSettings.companyAddress}
                      onChange={(e) => setSystemSettings({ ...systemSettings, companyAddress: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Localization</h4>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={systemSettings.timezone} onValueChange={(value) => setSystemSettings({ ...systemSettings, timezone: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select value={systemSettings.currency} onValueChange={(value) => setSystemSettings({ ...systemSettings, currency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-semibold">System Options</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    <Switch
                      id="maintenanceMode"
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, maintenanceMode: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="debugMode">Debug Mode</Label>
                    <Switch
                      id="debugMode"
                      checked={systemSettings.debugMode}
                      onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, debugMode: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={systemSettings.sessionTimeout}
                      onChange={(e) => setSystemSettings({ ...systemSettings, sessionTimeout: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSystemSettingsSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
              </div>
              <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                <DialogTrigger asChild>
                  <Button>
                    <Users className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>Create a new user account with appropriate role and permissions</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="userName">Full Name</Label>
                      <Input
                        id="userName"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userEmail">Email Address</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userRole">Role</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Administrator">Administrator</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Analyst">Analyst</SelectItem>
                          <SelectItem value="Viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sendWelcomeEmail"
                        checked={newUser.sendWelcomeEmail}
                        onCheckedChange={(checked) => setNewUser({ ...newUser, sendWelcomeEmail: checked })}
                      />
                      <Label htmlFor="sendWelcomeEmail">Send welcome email</Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
                    <Button onClick={handleAddUser} disabled={!newUser.name || !newUser.email}>Add User</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'Active' ? 'default' : 'destructive'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.lastLogin}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserStatusToggle(user.id)}
                        >
                          {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security policies and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Password Policy</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: e.target.value })}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Require Uppercase Letters</Label>
                      <Switch
                        checked={securitySettings.passwordRequireUppercase}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireUppercase: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Require Numbers</Label>
                      <Switch
                        checked={securitySettings.passwordRequireNumbers}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireNumbers: checked })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Account Lockout</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Account Lockout</Label>
                    <Switch
                      checked={securitySettings.accountLockoutEnabled}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, accountLockoutEnabled: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lockoutThreshold">Failed Login Threshold</Label>
                    <Input
                      id="lockoutThreshold"
                      type="number"
                      value={securitySettings.accountLockoutThreshold}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, accountLockoutThreshold: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSecuritySettingsSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Security Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how and when users receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Notification Channels</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label>Email Notifications</Label>
                    <Switch
                      checked={notificationSettings.emailEnabled}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailEnabled: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>SMS Notifications</Label>
                    <Switch
                      checked={notificationSettings.smsEnabled}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, smsEnabled: checked })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Alert Types</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Transaction Notifications</Label>
                    <Switch
                      checked={notificationSettings.transactionNotifications}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, transactionNotifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Risk Alert Notifications</Label>
                    <Switch
                      checked={notificationSettings.riskAlertNotifications}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, riskAlertNotifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>System Maintenance Notifications</Label>
                    <Switch
                      checked={notificationSettings.systemMaintenanceNotifications}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, systemMaintenanceNotifications: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNotificationSettingsSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Configure data retention, backup, and export settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Data Retention</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataRetentionPeriod">Data Retention Period (years)</Label>
                    <Input
                      id="dataRetentionPeriod"
                      type="number"
                      value={dataSettings.dataRetentionPeriod}
                      onChange={(e) => setDataSettings({ ...dataSettings, dataRetentionPeriod: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select value={dataSettings.backupFrequency} onValueChange={(value) => setDataSettings({ ...dataSettings, backupFrequency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Export Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exportFormat">Default Export Format</Label>
                    <Select value={dataSettings.exportFormat} onValueChange={(value) => setDataSettings({ ...dataSettings, exportFormat: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Enable Compression</Label>
                      <Switch
                        checked={dataSettings.compressionEnabled}
                        onCheckedChange={(checked) => setDataSettings({ ...dataSettings, compressionEnabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Enable Encryption</Label>
                      <Switch
                        checked={dataSettings.encryptionEnabled}
                        onCheckedChange={(checked) => setDataSettings({ ...dataSettings, encryptionEnabled: checked })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleDataSettingsSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Data Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

