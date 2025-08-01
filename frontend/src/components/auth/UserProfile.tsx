import React from 'react';
import { Avatar, Dropdown, Button, Space, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { appContext } from '../../hooks/provider';
import SettingsModal from '../settings/SettingsModal';

const { Text } = Typography;

const UserProfile: React.FC = () => {
  const { user, logout } = React.useContext(appContext);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_data');
    
    // Reset user state
    logout();
    
    // Reload page to reset the application state
    window.location.reload();
  };

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => console.log('Profile clicked')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => setIsSettingsOpen(true)
    },
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout
    }
  ];

  if (!user) {
    return null;
  }

  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        placement="bottomRight"
        trigger={['click']}
        overlayStyle={{ minWidth: '200px' }}
      >
        <Button
          type="text"
          className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-lg max-w-full"
        >
          <Avatar
            icon={<UserOutlined />}
            size="small"
            className="bg-blue-500 flex-shrink-0"
          />
          <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
            <Text strong className="text-sm truncate w-full">
              {user.name}
            </Text>
            <Text type="secondary" className="text-xs truncate w-full">
              {user.metadata?.role || 'User'}
            </Text>
          </div>
        </Button>
      </Dropdown>
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

export default UserProfile;