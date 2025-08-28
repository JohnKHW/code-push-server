import { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
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
  useDisclosure,
  useToast,
  Spinner,
  Center,
  Text,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Badge,
} from "@chakra-ui/react";
import { AddIcon, EditIcon, DeleteIcon, ViewIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import type { AxiosError } from "axios";
import { useRef } from "react";

interface App {
  name: string;
  collaborators?: Record<string, unknown>;
  deployments?: string[];
}

export const AppsPage = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [deletingApp, setDeletingApp] = useState<string>("");
  const [appName, setAppName] = useState("");
  const navigate = useNavigate();
  const toast = useToast();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const fetchApps = async () => {
    try {
      setLoading(true);
      console.log("Fetching apps from API...");
      const response = await http.get("/apps");
      console.log("API Response:", response);
      console.log("Response data:", response.data);

      // 處理不同的響應格式
      const appsData: App[] = response.data.apps;

      setApps(response.data.apps);

      if (appsData.length === 0) {
        toast({
          title: "No applications found",
          description: "Create your first app!",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error: unknown) {
      console.error("Fetch apps error:", error);
      console.error("Error response:", (error as AxiosError).response);

      if ((error as AxiosError).response?.status === 401) {
        toast({
          title: "Authentication failed",
          description: "Please check your Access Key.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else if ((error as AxiosError).response?.status === 404) {
        toast({
          title: "Apps endpoint not found",
          description: "Please check server configuration.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Failed to fetch applications",
          description: (error as Error).message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleCreateApp = () => {
    setEditingApp(null);
    setAppName("");
    onOpen();
  };

  const handleEditApp = (app: App) => {
    setEditingApp(app);
    setAppName(app.name);
    onOpen();
  };

  const handleDeleteApp = (appName: string) => {
    setDeletingApp(appName);
    onDeleteOpen();
  };

  const confirmDeleteApp = async () => {
    try {
      await http.delete(`/apps/${encodeURIComponent(deletingApp)}`);
      toast({
        title: "Application deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchApps();
    } catch (error: unknown) {
      toast({
        title: "Failed to delete application",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Delete app error:", error);
    } finally {
      onDeleteClose();
      setDeletingApp("");
    }
  };

  const handleSubmit = async () => {
    if (!appName.trim()) {
      toast({
        title: "Please enter application name",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      if (editingApp) {
        await http.patch(`/apps/${encodeURIComponent(editingApp.name)}`, {
          name: appName,
        });
        toast({
          title: "Application renamed successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        await http.post("/apps", { name: appName });
        toast({
          title: "Application created successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      onClose();
      fetchApps();
    } catch (error: unknown) {
      const errorMessage =
        (error as AxiosError<{ message: string }>).response?.data?.message ||
        (editingApp
          ? "Failed to rename application"
          : "Failed to create application");
      toast({
        title: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleViewDeployments = (appName: string) => {
    navigate(`/apps/${encodeURIComponent(appName)}/deployments`);
  };

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <Heading size="lg" color="primary.600">
          Applications
        </Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="brand"
          onClick={handleCreateApp}
        >
          Create Application
        </Button>
      </HStack>

      <Box bg="white" rounded="md" shadow="sm" p={6}>
        {loading ? (
          <Center py={12}>
            <VStack spacing={4}>
              <Spinner size="lg" color="primary.500" />
              <Text color="gray.500">Loading applications...</Text>
            </VStack>
          </Center>
        ) : apps.length === 0 ? (
          <Center py={12}>
            <VStack spacing={4}>
              <Text fontSize="lg" color="gray.500">
                No applications found
              </Text>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="brand"
                onClick={handleCreateApp}
              >
                Create Your First Application
              </Button>
            </VStack>
          </Center>
        ) : (
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Application Name</Th>
                  <Th>Deployments</Th>
                  <Th>Collaborators</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {apps.map((app) => (
                  <Tr key={app.name}>
                    <Td>
                      <HStack>
                        <ViewIcon color="primary.500" />
                        <Text fontWeight="semibold">{app.name}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Badge colorScheme="blue">
                        {app.deployments?.length || 0}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme="green">
                        {Object.keys(app.collaborators || {}).length}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          colorScheme="brand"
                          leftIcon={<ViewIcon />}
                          onClick={() => handleViewDeployments(app.name)}
                        >
                          Deployments
                        </Button>
                        <IconButton
                          aria-label="Edit app"
                          icon={<EditIcon />}
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditApp(app)}
                        />
                        <IconButton
                          aria-label="Delete app"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => handleDeleteApp(app.name)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Create/Edit App Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingApp ? "Rename Application" : "Create New Application"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>Application Name</FormLabel>
              <Input
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Enter application name"
                focusBorderColor="primary.500"
              />
              <Text fontSize="sm" color="gray.500" mt={2}>
                Name can only contain letters, numbers, hyphens, and underscores
              </Text>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="brand" onClick={handleSubmit}>
                {editingApp ? "Rename" : "Create"}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Application
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete "{deletingApp}"? This action
              cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDeleteApp} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
};
