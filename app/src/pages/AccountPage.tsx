import {
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  Badge,
  Button,
  Avatar,
  Divider,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { FiUser, FiMail, FiCalendar, FiKey } from "react-icons/fi";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";

interface Account {
  email: string;
  name: string;
  linkedProviders: string[];
}

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export const AccountPage = () => {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [appsCount, setAppsCount] = useState(0);
  const [deploymentsCount, setDeploymentsCount] = useState(0);
  const [releasesCount, setReleasesCount] = useState(0);
  const [accessKeysCount, setAccessKeysCount] = useState(0);
  const toast = useToast();
  const navigate = useNavigate();

  const fetchAccountData = useCallback(async () => {
    try {
      setLoading(true);

      // 獲取帳戶信息
      const accountResponse = await http.get("/account");
      console.log("Account API Response:", accountResponse.data);

      if (accountResponse.data?.account) {
        setAccount(accountResponse.data.account);
      }

      // 獲取應用數量和部署數量
      const appsResponse = await http.get("/apps");
      if (appsResponse.data?.apps) {
        const apps = appsResponse.data.apps;
        setAppsCount(apps.length);

        // 獲取每個應用的部署數量和發布數量
        let totalDeployments = 0;
        let totalReleases = 0;

        for (const app of apps) {
          try {
            const deploymentsResponse = await http.get(
              `/apps/${encodeURIComponent(app.name)}/deployments`
            );

            if (deploymentsResponse.data) {
              let deployments = [];

              if (
                deploymentsResponse.data.deployments &&
                Array.isArray(deploymentsResponse.data.deployments)
              ) {
                deployments = deploymentsResponse.data.deployments;
              } else if (Array.isArray(deploymentsResponse.data)) {
                deployments = deploymentsResponse.data;
              } else if (typeof deploymentsResponse.data === "object") {
                deployments = Object.keys(deploymentsResponse.data);
              }

              totalDeployments += deployments.length;

              // 獲取每個部署的發布歷史
              for (const deployment of deployments) {
                const deploymentName =
                  typeof deployment === "string" ? deployment : deployment.name;
                try {
                  const historyResponse = await http.get(
                    `/apps/${encodeURIComponent(
                      app.name
                    )}/deployments/${encodeURIComponent(
                      deploymentName
                    )}/history`
                  );

                  if (
                    historyResponse.data?.history &&
                    Array.isArray(historyResponse.data.history)
                  ) {
                    totalReleases += historyResponse.data.history.length;
                  } else if (Array.isArray(historyResponse.data)) {
                    totalReleases += historyResponse.data.length;
                  }
                } catch (error) {
                  // 忽略單個部署的錯誤
                  console.warn(
                    `Failed to fetch history for deployment ${deploymentName}:`,
                    error
                  );
                }
              }
            }
          } catch (error) {
            // 忽略單個應用的錯誤
            console.warn(
              `Failed to fetch deployments for app ${app.name}:`,
              error
            );
          }
        }

        setDeploymentsCount(totalDeployments);
        setReleasesCount(totalReleases);
      }

      // 獲取訪問密鑰數量
      try {
        const accessKeysResponse = await http.get("/accessKeys");
        if (
          accessKeysResponse.data?.accessKeys &&
          Array.isArray(accessKeysResponse.data.accessKeys)
        ) {
          setAccessKeysCount(accessKeysResponse.data.accessKeys.length);
        }
      } catch (error) {
        console.warn("Failed to fetch access keys:", error);
        // 訪問密鑰獲取失敗不影響其他數據顯示
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error("Failed to fetch account data:", apiError);

      if (apiError.response?.status !== 404) {
        toast({
          title: "Failed to load account data",
          description:
            apiError.response?.data?.message ||
            apiError.message ||
            "Unknown error",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData]);

  if (loading) {
    return (
      <Center py={12}>
        <VStack spacing={4}>
          <Spinner size="lg" color="primary.500" />
          <Text color="gray.500">Loading account information...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <Heading size="lg" color="primary.600">
          Account Information
        </Heading>
        <Badge colorScheme="green" px={3} py={1} borderRadius="full">
          Active
        </Badge>
      </HStack>

      <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={6}>
        {/* Profile Card */}
        <GridItem>
          <Card>
            <CardBody>
              <VStack spacing={4} align="center">
                <Avatar
                  size="xl"
                  name={account?.name || "User Account"}
                  bg="primary.500"
                />
                <VStack spacing={1} align="center">
                  <Heading size="md">{account?.name || "User Account"}</Heading>
                  <Text color="gray.500" fontSize="sm">
                    <HStack>
                      <FiMail size={14} />
                      <Text>{account?.email || "No email available"}</Text>
                    </HStack>
                  </Text>
                  {account?.linkedProviders &&
                    account.linkedProviders.length > 0 && (
                      <HStack>
                        {account.linkedProviders.map((provider) => (
                          <Badge key={provider} colorScheme="blue" size="sm">
                            {provider}
                          </Badge>
                        ))}
                      </HStack>
                    )}
                </VStack>
                <Button colorScheme="brand" size="sm" variant="outline">
                  Edit Profile
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>

        {/* Account Details */}
        <GridItem>
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Account Details</Heading>
                <Divider />

                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Stat>
                    <StatLabel>Total Apps</StatLabel>
                    <StatNumber>{appsCount}</StatNumber>
                    <StatHelpText>Active applications</StatHelpText>
                  </Stat>

                  <Stat>
                    <StatLabel>Total Deployments</StatLabel>
                    <StatNumber>{deploymentsCount}</StatNumber>
                    <StatHelpText>Across all apps</StatHelpText>
                  </Stat>

                  <Stat>
                    <StatLabel>Total Releases</StatLabel>
                    <StatNumber>{releasesCount}</StatNumber>
                    <StatHelpText>All time</StatHelpText>
                  </Stat>

                  <Stat>
                    <StatLabel>Access Keys</StatLabel>
                    <StatNumber>{accessKeysCount}</StatNumber>
                    <StatHelpText>Active keys</StatHelpText>
                  </Stat>
                </Grid>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Quick Actions */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md">Quick Actions</Heading>
            <Divider />

            <Grid
              templateColumns="repeat(auto-fit, minmax(200px, 1fr))"
              gap={4}
            >
              <Button
                leftIcon={<FiKey />}
                variant="outline"
                justifyContent="flex-start"
                h="auto"
                py={4}
                onClick={() => navigate("/access-keys")}
              >
                <VStack align="start" spacing={1}>
                  <Text fontWeight="medium">Manage Access Keys</Text>
                  <Text fontSize="sm" color="gray.500">
                    Create and manage API keys
                  </Text>
                </VStack>
              </Button>

              <Button
                leftIcon={<FiUser />}
                variant="outline"
                justifyContent="flex-start"
                h="auto"
                py={4}
                onClick={() => navigate("/apps")}
              >
                <VStack align="start" spacing={1}>
                  <Text fontWeight="medium">Manage Apps</Text>
                  <Text fontSize="sm" color="gray.500">
                    View apps and collaborators
                  </Text>
                </VStack>
              </Button>

              <Button
                leftIcon={<FiCalendar />}
                variant="outline"
                justifyContent="flex-start"
                h="auto"
                py={4}
                onClick={() => navigate("/metrics")}
              >
                <VStack align="start" spacing={1}>
                  <Text fontWeight="medium">View Metrics</Text>
                  <Text fontSize="sm" color="gray.500">
                    Analytics and insights
                  </Text>
                </VStack>
              </Button>
            </Grid>
          </VStack>
        </CardBody>
      </Card>

      {/* API Status */}
      <Card
        bg={account ? "green.50" : "orange.50"}
        borderColor={account ? "green.200" : "orange.200"}
      >
        <CardBody>
          <HStack>
            <Badge colorScheme={account ? "green" : "orange"}>
              {account ? "Connected" : "API Unavailable"}
            </Badge>
            <Text color={account ? "green.800" : "orange.800"}>
              {account
                ? "Successfully connected to Account API - showing real data"
                : "Account API not available - check server configuration"}
            </Text>
          </HStack>
        </CardBody>
      </Card>
    </VStack>
  );
};
