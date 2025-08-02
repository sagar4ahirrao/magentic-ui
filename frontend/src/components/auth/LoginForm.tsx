import React, { useState } from 'react';
import { Form, Input, Card, Alert, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { appContext } from '../../hooks/provider';
import { Button } from '../common/Button';
import logo from '../../assets/logo.svg';

const { Title, Text } = Typography;

interface LoginFormProps {
  onSuccess?: () => void;
}

// Demo credentials
const DEMO_CREDENTIALS = {
  admin: { username: 'admin', password: 'admin123', role: 'admin' },
  user: { username: 'user', password: 'user123', role: 'user' },
  guest: { username: 'guest', password: 'guest123', role: 'guest' }
};

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = React.useContext(appContext);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError('');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check against demo credentials
    const credential = Object.values(DEMO_CREDENTIALS).find(
      cred => cred.username === values.username && cred.password === values.password
    );

    if (credential) {
      // Login successful
      const userData = {
        name: credential.username,
        email: `${credential.username}@kpmg.com`,
        username: credential.username,
        role: credential.role,
        metadata: {
          role: credential.role,
          loginTime: new Date().toISOString()
        }
      };

      setUser(userData);
      localStorage.setItem('user_email', userData.email);
      localStorage.setItem('user_data', JSON.stringify(userData));

      if (onSuccess) {
        onSuccess();
      }
    } else {
      setError('Invalid username or password. Please try again.');
    }

    setLoading(false);
  };

  const handleDemoLogin = (type: 'admin' | 'user' | 'guest') => {
    const credential = DEMO_CREDENTIALS[type];
    onFinish({ username: credential.username, password: credential.password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <Card className="w-full max-w-md shadow-lg bg-tertiary">
        <div className="text-center mb-6">
          {/* <img src={logo} alt="Browser-Agent Logo" className="h-24 w-24 mx-auto mb-4" /> */}
          <Title level={1} className="mb-2 text-primary">
            Welcome to Browser-Agent
          </Title>
          <Text className="text-secondary">
            Sign in to your account to continue
          </Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input
              prefix={<UserOutlined className="text-secondary" />}
              placeholder="Username"
              autoComplete="username"
              className="bg-primary text-primary border-secondary"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-secondary" />}
              placeholder="Password"
              autoComplete="current-password"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              className="bg-primary text-primary border-secondary"
            />
          </Form.Item>

          <Form.Item>
            <Button
              variant="primary"
              type="submit"
              isLoading={loading}
              fullWidth
              size="lg"
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        {/* <div className="mt-6">
          <Text className="block text-center mb-4 text-secondary">
            Or try with demo credentials:
          </Text>
          <Space direction="vertical" className="w-full">
            <Button
              onClick={() => handleDemoLogin('admin')}
              fullWidth
              size="lg"
              variant="secondary"
            >
              Login as Admin (admin/admin123)
            </Button>
            <Button
              onClick={() => handleDemoLogin('user')}
              fullWidth
              size="lg"
              variant="secondary"
            >
              Login as User (user/user123)
            </Button>
            <Button
              onClick={() => handleDemoLogin('guest')}
              fullWidth
              size="lg"
              variant="secondary"
            >
              Login as Guest (guest/guest123)
            </Button>
          </Space>
        </div> */}
      </Card>
    </div>
  );
};

export default LoginForm;
