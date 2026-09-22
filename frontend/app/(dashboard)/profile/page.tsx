'use client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User as UserIcon, Mail } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-500 mt-1">Manage your account settings.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-800">Account Information</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <UserIcon size={32} />
            </div>
            <div>
              <h3 className="text-xl font-medium text-slate-900">{user?.name}</h3>
              <div className="flex items-center text-slate-500 mt-1">
                <Mail size={16} className="mr-2" />
                <span>{user?.email}</span>
              </div>
            </div>
          </div>
          
          <div className="pt-2">
            <Button variant="danger" onClick={logout}>
              Log out of all devices
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
