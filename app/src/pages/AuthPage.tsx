import { useState } from "react";
import {
  Box,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Button,
  Heading,
  Text,
  VStack,
  Alert,
  AlertIcon,
  Container,
  Icon,
  useToast,
} from "@chakra-ui/react";
import { ViewIcon } from "@chakra-ui/icons";
import { useAuth } from "../hooks/useAuth";
import { http } from "../api/http";

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export const AuthPage = () => {
  const [accessKey, setAccessKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessKey.trim()) {
      setError("Please enter your Access Key");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Testing Access Key:", accessKey);

      // 先暫時儲存 Access Key 以供 http 客戶端使用
      localStorage.setItem("accessKey", accessKey);

      // 驗證 Access Key 是否有效
      const response = await http.get("/apps");

      console.log("Auth test response:", response);
      console.log("Auth response status:", response.status);
      console.log("Auth response data:", response.data);

      if (response.status === 200) {
        login(accessKey);
        console.log("Authentication successful");
        toast({
          title: "Authentication Successful",
          description: "Welcome to CodePush Admin!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error("Authentication error:", apiError);
      console.error("Error response:", apiError.response);

      // 移除無效的 Access Key
      localStorage.removeItem("accessKey");

      if (apiError.response?.status === 401) {
        setError("Invalid Access Key. Please check and try again.");
      } else if (apiError.response?.status === 404) {
        setError(
          "Server endpoint not found. Please check server configuration."
        );
      } else if (apiError.message === "Network Error" || !apiError.response) {
        setError(
          "Unable to connect to server. Please check server URL and try again."
        );
      } else {
        setError(
          `Server error: ${apiError.response?.status || "Unknown"}. ${
            apiError.message
          }`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, blue.50, blue.100)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Container maxW="md">
        <Card shadow="lg">
          <CardBody p={8}>
            <VStack spacing={8} textAlign="center">
              <VStack spacing={4}>
                <Icon as={ViewIcon} boxSize={16} color="primary.500" />
                <VStack spacing={2}>
                  <Heading size="lg" color="primary.600">
                    CodePush Admin
                  </Heading>
                  <Text color="gray.600">
                    Enter your Access Key to manage applications and deployments
                  </Text>
                </VStack>
              </VStack>

              {error && (
                <Alert status="error" rounded="md">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              <Box as="form" onSubmit={handleSubmit} w="100%">
                <VStack spacing={6}>
                  <FormControl isRequired>
                    <FormLabel>Access Key</FormLabel>
                    <Input
                      type="password"
                      placeholder="Enter your Access Key"
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                      size="lg"
                      focusBorderColor="primary.500"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    size="lg"
                    isLoading={loading}
                    loadingText="Verifying..."
                    w="100%"
                    colorScheme="brand"
                  >
                    Sign In
                  </Button>
                </VStack>
              </Box>

              <Box pt={6} borderTop="1px" borderColor="gray.100" w="100%">
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  You can obtain an Access Key from your CodePush server's
                  authentication page or through the CLI.
                </Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
};
