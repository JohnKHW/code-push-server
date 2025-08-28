import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,

  Select,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Center,
  Spinner,
} from "@chakra-ui/react";
import { FiTrendingUp, FiPackage, FiRefreshCw } from "react-icons/fi";
import { useState, useEffect } from "react";
import { http } from "../api/http";

// Calculate totals from real data
const calculateTotals = (apps: App[], metrics: Record<string, unknown>) => {
  let totalDeployments = 0;
  let totalReleases = 0;
  let appsWithMetrics = 0;

  apps.forEach(app => {
    totalDeployments += app.deployments?.length || 0;
    if (metrics[app.name]) {
      appsWithMetrics++;
      // In real implementation, you would sum up actual metrics here
      totalReleases += Object.keys(metrics[app.name] as Record<string, unknown>).length;
    }
  });

  return {
    totalDeployments,
    totalReleases,
    appsWithMetrics,
  };
};

interface App {
  name: string;
  deployments?: string[];
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

export const MetricsPage = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState<App[]>([]);
  const [metrics, setMetrics] = useState<Record<string, Record<string, unknown>>>({});

  const fetchAppsAndMetrics = async () => {
    try {
      setLoading(true);

      // 獲取所有應用
      const appsResponse = await http.get("/apps");
      console.log("Apps for metrics:", appsResponse.data);

      if (appsResponse.data?.apps) {
        setApps(appsResponse.data.apps);

                  // 嘗試獲取每個應用的每個部署的 metrics
          const allMetrics: Record<string, Record<string, unknown>> = {};

        for (const app of appsResponse.data.apps) {
          if (app.deployments && app.deployments.length > 0) {
            for (const deployment of app.deployments) {
              try {
                const metricsResponse = await http.get(
                  `/apps/${encodeURIComponent(
                    app.name
                  )}/deployments/${encodeURIComponent(deployment)}/metrics`
                );
                console.log(
                  `Metrics for ${app.name}/${deployment}:`,
                  metricsResponse.data
                );

                if (!allMetrics[app.name]) {
                  allMetrics[app.name] = {};
                }
                allMetrics[app.name][deployment] = metricsResponse.data;
                              } catch {
                console.log(
                  `No metrics available for ${app.name}/${deployment}`
                );
              }
            }
          }
        }

        setMetrics(allMetrics);
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error("Failed to fetch metrics:", apiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppsAndMetrics();
  }, []);

  const handleRefresh = () => {
    fetchAppsAndMetrics();
  };

  const totals = calculateTotals(apps, metrics);

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <VStack align="start" spacing={1}>
          <Heading size="lg" color="primary.600">
            Analytics Dashboard
          </Heading>
          <Text color="gray.600">
            Track your CodePush deployment metrics and user engagement
          </Text>
        </VStack>
        <HStack>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            w="auto"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </Select>
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={handleRefresh}
            isLoading={loading}
          >
            Refresh
          </Button>
        </HStack>
      </HStack>

      {/* Key Metrics */}
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        }}
        gap={6}
      >
        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Downloads</StatLabel>
                <StatNumber>
                  {totals.appsWithMetrics > 0 ? "Available" : "No Data"}
                </StatNumber>
                <StatHelpText>
                  Requires metrics data
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Deployments</StatLabel>
                <StatNumber>{totals.totalDeployments}</StatNumber>
                <StatHelpText>
                  Across all applications
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Active Apps</StatLabel>
                <StatNumber>{apps.length}</StatNumber>
                <StatHelpText>
                  <FiPackage
                    style={{ display: "inline", marginRight: "4px" }}
                  />
                  {Object.keys(metrics).length > 0
                    ? `${Object.keys(metrics).length} with metrics`
                    : "All deployments"}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Apps with Metrics</StatLabel>
                <StatNumber>{totals.appsWithMetrics}</StatNumber>
                <StatHelpText>Out of {apps.length} total apps</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
        {/* Top Apps */}
        <GridItem>
          <Card>
            <CardHeader>
              <HStack>
                <FiTrendingUp />
                <Heading size="md">Top Performing Apps</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                {apps.length > 0 ? (
                  apps.slice(0, 5).map((app, index) => (
                    <Box key={app.name} w="100%">
                      <HStack justify="space-between" mb={2}>
                        <HStack>
                          <Badge colorScheme="brand" variant="subtle">
                            #{index + 1}
                          </Badge>
                          <Text fontWeight="medium">{app.name}</Text>
                        </HStack>
                        <VStack align="end" spacing={0}>
                          <Text fontSize="sm" fontWeight="bold">
                            {app.deployments?.length || 0} deployments
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {metrics[app.name] ? "Has metrics" : "No metrics"}
                          </Text>
                        </VStack>
                      </HStack>
                      <Progress
                        value={
                          ((app.deployments?.length || 0) /
                            Math.max(
                              ...apps.map((a) => a.deployments?.length || 0),
                              1
                            )) *
                          100
                        }
                        colorScheme="brand"
                        size="sm"
                        borderRadius="md"
                      />
                    </Box>
                  ))
                ) : (
                  <Text color="gray.500" textAlign="center">
                    {loading
                      ? "Loading applications..."
                      : "No applications found"}
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        </GridItem>

        {/* Apps with Metrics */}
        <GridItem>
          <Card>
            <CardHeader>
              <HStack>
                <FiPackage />
                <Heading size="md">Apps with Metrics</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                {Object.keys(metrics).length > 0 ? (
                  Object.entries(metrics).map(([appName, appMetrics]) => (
                    <Box key={appName} w="100%">
                      <VStack align="stretch" spacing={1}>
                        <HStack justify="space-between">
                          <Text fontWeight="medium" fontSize="sm">
                            {appName}
                          </Text>
                          <Badge colorScheme="green" size="sm">
                            {Object.keys(appMetrics as Record<string, unknown>).length} deployments
                          </Badge>
                        </HStack>
                        <Text fontSize="xs" color="gray.500">
                          Metrics available for all deployments
                        </Text>
                      </VStack>
                    </Box>
                  ))
                ) : (
                  <Text color="gray.500" textAlign="center">
                    {loading
                      ? "Loading metrics..."
                      : "No metrics data available"}
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader>
          <Heading size="md">Detailed Metrics</Heading>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Center py={8}>
              <VStack spacing={4}>
                <Spinner size="lg" color="primary.500" />
                <Text color="gray.500">Loading metrics data...</Text>
              </VStack>
            </Center>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Application</Th>
                  <Th>Latest Version</Th>
                  <Th>Downloads</Th>
                  <Th>Active Users</Th>
                  <Th>Success Rate</Th>
                  <Th>Last Update</Th>
                </Tr>
              </Thead>
              <Tbody>
                {apps.map((app) => (
                  <Tr key={app.name}>
                    <Td>
                      <Text fontWeight="medium">{app.name}</Text>
                    </Td>
                    <Td>
                      <Badge colorScheme="blue">-</Badge>
                    </Td>
                    <Td>{metrics[app.name] ? "Available" : "No data"}</Td>
                    <Td>{metrics[app.name] ? "Available" : "No data"}</Td>
                    <Td>
                      <HStack>
                        <Progress
                          value={metrics[app.name] ? 100 : 0}
                          colorScheme={metrics[app.name] ? "green" : "gray"}
                          size="sm"
                          w="60px"
                        />
                        <Text fontSize="sm">
                          {metrics[app.name] ? "100%" : "0%"}
                        </Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color="gray.500">
                        {metrics[app.name] ? "Available" : "No data"}
                      </Text>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* API Status */}
      <Card
        bg={apps.length > 0 ? "green.50" : "orange.50"}
        borderColor={apps.length > 0 ? "green.200" : "orange.200"}
      >
        <CardBody>
          <HStack>
            <Badge colorScheme={apps.length > 0 ? "green" : "orange"}>
              {apps.length > 0 ? "Partially Connected" : "API Unavailable"}
            </Badge>
            <Text color={apps.length > 0 ? "green.800" : "orange.800"}>
              {apps.length > 0
                ? `Connected to Apps API - found ${apps.length} apps. Metrics API available for individual deployments.`
                : "Apps and Metrics APIs not available - check server configuration"}
            </Text>
          </HStack>
        </CardBody>
      </Card>
    </VStack>
  );
};
