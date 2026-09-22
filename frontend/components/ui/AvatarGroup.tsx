import React from 'react';

interface AvatarGroupProps {
  users: { name: string; avatarUrl?: string; id: string }[];
  max?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({ users, max = 3, className = '', size = 'md' }) => {
  const displayUsers = users.slice(0, max);
  const remaining = users.length - max;

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className={`flex items-center -space-x-2 ${className}`}>
      {displayUsers.map((user, i) => (
        <div
          key={user.id}
          className={`${sizeClasses[size]} rounded-full ring-2 ring-white bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold z-[${30 - i}]`}
          title={user.name}
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            getInitials(user.name)
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div className={`${sizeClasses[size]} rounded-full ring-2 ring-white bg-slate-100 text-slate-600 flex items-center justify-center font-medium z-0`}>
          +{remaining}
        </div>
      )}
    </div>
  );
};
