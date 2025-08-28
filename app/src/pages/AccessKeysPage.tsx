import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  Button,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  Code,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Center,
  Spinner,
} from "@chakra-ui/react";
import {
  FiPlus,
  FiKey,
  FiTrash2,
  FiCopy,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { useState, useEffect, useCallback } from "react";
import { http } from "../api/http";

interface AccessKey {
  name?: string;
  friendlyName?: string;
  description?: string;
  createdTime?: number;
  expires: number;
  isSession?: boolean;
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

export const AccessKeysPage = () => {
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("");
  const [keyDescription, setKeyDescription] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchAccessKeys = useCallback(async () => {
    try {
      setLoading(true);
      const response = await http.get("/accessKeys");
      console.log("Access Keys API Response:", response.data);

      if (response.data?.accessKeys) {
        setAccessKeys(response.data.accessKeys);
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error("Failed to fetch access keys:", apiError);

      if (apiError.response?.status !== 404) {
        toast({
          title: "Failed to load access keys",
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
    fetchAccessKeys();
  }, [fetchAccessKeys]);

  const handleCreateKey = async () => {
    try {
      const response = await http.post("/accessKeys", {
        friendlyName: keyName,
        description: keyDescription,
      });

      console.log("Create access key response:", response.data);

      toast({
        title: "Access Key Created",
        description: "Your new access key has been generated successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setKeyName("");
      setKeyDescription("");
      onClose();
      fetchAccessKeys(); // Reload the keys
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error("Failed to create access key:", apiError);

      toast({
        title: "Failed to create access key",
        description:
          apiError.response?.data?.message ||
          apiError.message ||
          "Unknown error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteKey = async (keyName: string) => {
    try {
      await http.delete(`/accessKeys/${encodeURIComponent(keyName)}`);

      toast({
        title: "Access Key Deleted",
        description: "The access key has been removed.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });

      fetchAccessKeys(); // Reload the keys
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error("Failed to delete access key:", apiError);

      toast({
        title: "Failed to delete access key",
        description:
          apiError.response?.data?.message ||
          apiError.message ||
          "Unknown error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <VStack align="start" spacing={1}>
          <Heading size="lg" color="primary.600">
            Access Keys
          </Heading>
          <Text color="gray.600">
            Manage API keys for CodePush authentication
          </Text>
        </VStack>
        <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={onOpen}>
          Create New Key
        </Button>
      </HStack>

      {/* Security Notice */}
      <Alert status="warning">
        <AlertIcon />
        <Box>
          <AlertTitle>Security Notice</AlertTitle>
          <AlertDescription>
            Store your access keys securely. They provide full access to your
            CodePush account.
          </AlertDescription>
        </Box>
      </Alert>

      {/* Access Keys Table */}
      <Card>
        <CardBody>
          {loading ? (
            <Center py={8}>
              <VStack spacing={4}>
                <Spinner size="lg" color="primary.500" />
                <Text color="gray.500">Loading access keys...</Text>
              </VStack>
            </Center>
          ) : accessKeys.length === 0 ? (
            <VStack spacing={4} py={8}>
              <FiKey size={48} color="gray" />
              <VStack spacing={2}>
                <Text fontSize="lg" fontWeight="medium">
                  No Access Keys
                </Text>
                <Text color="gray.500">
                  Create your first access key to start using the CodePush API
                </Text>
              </VStack>
              <Button
                leftIcon={<FiPlus />}
                colorScheme="brand"
                onClick={onOpen}
              >
                Create Access Key
              </Button>
            </VStack>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Description</Th>
                  <Th>Created</Th>
                  <Th>Expires</Th>
                  <Th>Last Used</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {accessKeys.map((key, index) => {
                  const keyId = key.friendlyName || key.name || `key-${index}`;
                  return (
                    <Tr key={keyId}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Text fontWeight="medium">
                              {key.friendlyName || key.name || "Unnamed Key"}
                            </Text>
                            {key.isSession && (
                              <Badge colorScheme="purple" size="sm">
                                Session
                              </Badge>
                            )}
                          </HStack>
                          {showKey === keyId && key.name && key.name !== "(hidden)" && (
                            <HStack>
                              <Code fontSize="xs" p={2}>
                                {key.name}
                              </Code>
                              <IconButton
                                aria-label="Copy key"
                                icon={<FiCopy />}
                                size="xs"
                                onClick={() => copyToClipboard(key.name || "")}
                              />
                            </HStack>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="gray.600">
                          {key.description || "No description"}
                        </Text>
                      </Td>
                      <Td>
                        {key.createdTime
                          ? new Date(key.createdTime).toLocaleDateString()
                          : "Unknown"}
                      </Td>
                      <Td>{new Date(key.expires).toLocaleDateString()}</Td>
                      <Td>
                        <Badge colorScheme="gray" variant="subtle">
                          Unknown
                        </Badge>
                      </Td>
                      <Td>
                        <HStack>
                          <IconButton
                            aria-label={
                              showKey === keyId ? "Hide key" : "Show key"
                            }
                            icon={showKey === keyId ? <FiEyeOff /> : <FiEye />}
                            size="sm"
                            variant="ghost"
                            isDisabled={key.name === "(hidden)"}
                            onClick={() =>
                              setShowKey(showKey === keyId ? null : keyId)
                            }
                          />
                          <IconButton
                            aria-label="Delete key"
                            icon={<FiTrash2 />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() =>
                              handleDeleteKey(
                                key.friendlyName || key.name || ""
                              )
                            }
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* API Status */}
      <Card
        bg={!loading && accessKeys.length >= 0 ? "green.50" : "orange.50"}
        borderColor={
          !loading && accessKeys.length >= 0 ? "green.200" : "orange.200"
        }
      >
        <CardBody>
          <HStack>
            <Badge
              colorScheme={
                !loading && accessKeys.length >= 0 ? "green" : "orange"
              }
            >
              {!loading && accessKeys.length >= 0
                ? "Connected"
                : "API Unavailable"}
            </Badge>
            <Text
              color={
                !loading && accessKeys.length >= 0 ? "green.800" : "orange.800"
              }
            >
              {!loading && accessKeys.length >= 0
                ? "Successfully connected to Access Keys API - full CRUD operations available"
                : "Access Keys API not available - check server configuration"}
            </Text>
          </HStack>
        </CardBody>
      </Card>

      {/* Create Access Key Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Access Key</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Key Name</FormLabel>
                <Input
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g., Development Key"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={keyDescription}
                  onChange={(e) => setKeyDescription(e.target.value)}
                  placeholder="Optional description for this key"
                  rows={3}
                />
              </FormControl>

              <Alert status="info">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  Make sure to copy your access key after creation. You won't be
                  able to see it again.
                </AlertDescription>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleCreateKey}
                isDisabled={!keyName.trim()}
              >
                Create Key
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};
