import { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Button,
  Text,
  Input,
  InputGroup,
  InputLeftAddon,
  Alert,
  AlertIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Textarea,
  Grid,
  GridItem,
  useToast,
  Badge,
  Spacer,
} from "@chakra-ui/react";
import { WarningIcon, CheckIcon, TriangleUpIcon } from "@chakra-ui/icons";
import { http } from "../api/http";

interface TestResult {
  test: string;
  success: boolean;
  data: unknown;
  error?: unknown;
  timestamp: string;
}

export const ApiDebugger = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [testUrl, setTestUrl] = useState("/apps");
  const toast = useToast();

  const addResult = (
    test: string,
    success: boolean,
    data: unknown,
    error?: unknown
  ) => {
    const result: TestResult = {
      test,
      success,
      data,
      error,
      timestamp: new Date().toISOString(),
    };
    setResults((prev) => [result, ...prev]);
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      console.log("Testing basic connection...");
      const response = await fetch("/api/health");
      const data = await response.text();
      addResult("Health Check", response.ok, { status: response.status, data });

      if (response.ok) {
        toast({
          title: "Health check successful",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      addResult("Health Check", false, null, error);
      toast({
        title: "Health check failed",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  const testApiEndpoint = async () => {
    setLoading(true);
    try {
      console.log(`Testing API endpoint: ${testUrl}`);
      const response = await http.get(testUrl);
      addResult(`API Test: ${testUrl}`, true, response.data);
      toast({
        title: `API test successful for ${testUrl}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error: unknown) {
      addResult(`API Test: ${testUrl}`, false, null, error);
      toast({
        title: `API test failed for ${testUrl}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  const testDirectApi = async () => {
    setLoading(true);
    try {
      const accessKey = localStorage.getItem("accessKey");
      console.log("Testing direct API call...");

      const directUrl = `https://codepush-gammon.gammonconstruction.com${testUrl}`;
      const response = await fetch(directUrl, {
        headers: {
          Accept: "application/vnd.code-push.v2+json",
          Authorization: accessKey ? `Bearer ${accessKey}` : "",
        },
      });

      const data = await response.json();
      addResult(`Direct API: ${testUrl}`, response.ok, {
        status: response.status,
        data,
      });

      if (response.ok) {
        toast({
          title: "Direct API test successful",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      addResult(`Direct API: ${testUrl}`, false, null, error);
      toast({
        title: "Direct API test failed",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <VStack spacing={6} align="stretch">
      <Alert status="info">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">API Debug Tools</Text>
          <Text fontSize="sm">
            Use these tools to test API connectivity and debug issues.
          </Text>
        </Box>
      </Alert>

      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
        <GridItem>
          <Box p={4} border="1px" borderColor="gray.200" rounded="md">
            <Heading size="sm" mb={4}>
              Test Endpoint
            </Heading>

            <VStack spacing={3}>
              <InputGroup>
                <InputLeftAddon>/api</InputLeftAddon>
                <Input
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="API endpoint to test"
                  focusBorderColor="primary.500"
                />
              </InputGroup>

              <HStack spacing={2} w="100%">
                <Button
                  colorScheme="brand"
                  leftIcon={<TriangleUpIcon />}
                  onClick={testApiEndpoint}
                  isLoading={loading}
                  size="sm"
                  flex={1}
                >
                  Test via Proxy
                </Button>

                <Button
                  leftIcon={<TriangleUpIcon />}
                  onClick={testDirectApi}
                  isLoading={loading}
                  size="sm"
                  flex={1}
                >
                  Test Direct
                </Button>
              </HStack>

              <Button
                onClick={testConnection}
                isLoading={loading}
                size="sm"
                w="100%"
                variant="outline"
              >
                Health Check
              </Button>
            </VStack>
          </Box>
        </GridItem>

        <GridItem>
          <Box p={4} border="1px" borderColor="gray.200" rounded="md">
            <Heading size="sm" mb={4}>
              Current Config
            </Heading>

            <VStack spacing={2} align="start" fontSize="sm">
              <HStack>
                <Text fontWeight="bold">Environment:</Text>
                <Badge colorScheme={import.meta.env.DEV ? "green" : "blue"}>
                  {import.meta.env.DEV ? "Development" : "Production"}
                </Badge>
              </HStack>

              <HStack>
                <Text fontWeight="bold">Base URL:</Text>
                <Text fontSize="xs">
                  {import.meta.env.DEV
                    ? "/api (proxy)"
                    : import.meta.env.VITE_API_URL}
                </Text>
              </HStack>

              <HStack>
                <Text fontWeight="bold">Proxy Target:</Text>
                <Text fontSize="xs">
                  codepush-gammon.gammonconstruction.com
                </Text>
              </HStack>

              <HStack>
                <Text fontWeight="bold">Access Key:</Text>
                <Badge
                  colorScheme={
                    localStorage.getItem("accessKey") ? "green" : "red"
                  }
                >
                  {localStorage.getItem("accessKey") ? "Present" : "Missing"}
                </Badge>
              </HStack>
            </VStack>
          </Box>
        </GridItem>
      </Grid>

      <Box>
        <HStack justify="space-between" mb={4}>
          <Heading size="md">Test Results</Heading>
          <Button
            onClick={clearResults}
            isDisabled={results.length === 0}
            size="sm"
            variant="outline"
          >
            Clear Results
          </Button>
        </HStack>

        {results.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            <Text>
              No test results yet. Run some tests to see results here.
            </Text>
          </Alert>
        ) : (
          <Accordion allowMultiple>
            {results.map((result, index) => (
              <AccordionItem key={index}>
                <AccordionButton>
                  <HStack flex={1} textAlign="left">
                    {result.success ? (
                      <CheckIcon color="green.500" />
                    ) : (
                      <WarningIcon color="red.500" />
                    )}
                    <Text fontWeight="medium">{result.test}</Text>
                    <Spacer />
                    <Text fontSize="xs" color="gray.500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </Text>
                  </HStack>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  {result.success ? (
                    <VStack align="start" spacing={3}>
                      <Text fontWeight="bold" color="green.600">
                        Success!
                      </Text>
                      <Textarea
                        value={JSON.stringify(result.data, null, 2)}
                        isReadOnly
                        fontSize="sm"
                        minH="150px"
                        bg="gray.50"
                      />
                    </VStack>
                  ) : (
                    <VStack align="start" spacing={3}>
                      <Alert status="error">
                        <AlertIcon />
                        <Box>
                          <Text fontWeight="bold">Test Failed</Text>
                          <Text fontSize="sm">
                            {(result.error as Error).message || "Unknown error"}
                          </Text>
                        </Box>
                      </Alert>
                      <Textarea
                        value={JSON.stringify(result.error, null, 2)}
                        isReadOnly
                        fontSize="sm"
                        minH="150px"
                        bg="red.50"
                      />
                    </VStack>
                  )}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </Box>
    </VStack>
  );
};
