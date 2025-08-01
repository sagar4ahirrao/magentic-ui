import * as React from "react";
import MagenticUILayout from "../components/layout";
import { graphql } from "gatsby";
import { appContext } from "../hooks/provider";
import { Card, Typography, Space, Tag } from "antd";
import { UserOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

// markup
const IndexPage = ({ data }: any) => {
  const { user } = React.useContext(appContext);

  return (
    <MagenticUILayout meta={data.site.siteMetadata} title="Home" link={"/"}>
      <main style={{ height: "100%" }} className="h-full p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <div className="text-center mb-8">
              <Title level={1} className="mb-4">
                Welcome to Browser-Agent
              </Title>
              <Paragraph className="text-lg">
                Your AI-powered development environment
              </Paragraph>
            </div>

            {user && (
              <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20">
                <Space direction="vertical" size="middle" className="w-full">
                  <div className="flex items-center space-x-3">
                    <UserOutlined className="text-blue-600" />
                    <div>
                      <Text strong className="text-lg">
                        Welcome back, {user.name}!
                      </Text>
                      <div className="flex items-center space-x-2 mt-1">
                        <Tag color="blue">{user.metadata?.role || 'User'}</Tag>
                        <CheckCircleOutlined className="text-green-600" />
                        <Text type="secondary">Authenticated</Text>
                      </div>
                    </div>
                  </div>
                  <Text type="secondary">
                    You're now logged in and can access all features of Browser-Agent.
                  </Text>
                </Space>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <Card title="Getting Started" className="h-full">
                <Paragraph>
                  Start by exploring the session manager and creating your first AI-powered workflow.
                </Paragraph>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Create a new session</li>
                  <li>Configure your AI agents</li>
                  <li>Build and test your workflows</li>
                  <li>Monitor and optimize performance</li>
                </ul>
              </Card>

              <Card title="Features" className="h-full">
                <Paragraph>
                Browser-Agent provides powerful tools for AI-driven development.
                </Paragraph>
                <div className="space-y-2">
                  <Tag color="green">AI Agents</Tag>
                  <Tag color="blue">Workflow Builder</Tag>
                  <Tag color="purple">Session Management</Tag>
                  <Tag color="orange">Real-time Monitoring</Tag>
                </div>
              </Card>
            </div>
          </Card>
        </div>
      </main>
    </MagenticUILayout>
  );
};

export const query = graphql`
  query HomePageQuery {
    site {
      siteMetadata {
        description
        title
      }
    }
  }
`;

export default IndexPage;
