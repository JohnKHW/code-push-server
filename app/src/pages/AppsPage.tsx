import { useState, useEffect, useCallback } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Button,
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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Card,
  CardBody,
  Grid,
  Spacer,
  Tag,
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

interface AppGroup {
  baseName: string;
  apps: Array<App & { platform: string; displayName: string }>;
}

// 解析應用程式名稱，提取基礎名稱和平台
const parseAppName = (appName: string) => {
  // 常見的分隔符：-, _, 空格
  const separators = ['-', '_', ' '];
  const platforms = ['ios', 'android', 'web', 'windows', 'macos', 'linux'];
  
  let baseName = appName;
  let platform = 'other';
  
  for (const separator of separators) {
    const parts = appName.toLowerCase().split(separator);
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1];
      if (platforms.includes(lastPart)) {
        platform = lastPart;
        // 保持原始大小寫的基礎名稱
        const lowerCaseAppName = appName.toLowerCase();
        const separatorIndex = lowerCaseAppName.lastIndexOf(separator + lastPart);
        baseName = appName.substring(0, separatorIndex);
        break;
      }
    }
  }
  
  return { baseName, platform };
};

// 將應用程式按基礎名稱分組
const groupAppsByBaseName = (apps: App[]): AppGroup[] => {
  const groups: Record<string, AppGroup> = {};
  
  apps.forEach(app => {
    const { baseName, platform } = parseAppName(app.name);
    
    if (!groups[baseName]) {
      groups[baseName] = {
        baseName,
        apps: []
      };
    }
    
    groups[baseName].apps.push({
      ...app,
      platform,
      displayName: app.name
    });
  });
  
  // 排序：先按基礎名稱，再按平台
  Object.values(groups).forEach(group => {
    group.apps.sort((a, b) => {
      const platformOrder = ['ios', 'android', 'web', 'windows', 'macos', 'linux', 'other'];
      return platformOrder.indexOf(a.platform) - platformOrder.indexOf(b.platform);
    });
  });
  
  return Object.values(groups).sort((a, b) => a.baseName.localeCompare(b.baseName));
};

// 獲取平台對應的顏色和顯示名稱
const getPlatformInfo = (platform: string) => {
  const platformMap: Record<string, { color: string; displayName: string }> = {
    ios: { color: 'blue', displayName: 'iOS' },
    android: { color: 'green', displayName: 'Android' },
    web: { color: 'purple', displayName: 'Web' },
    windows: { color: 'cyan', displayName: 'Windows' },
    macos: { color: 'gray', displayName: 'macOS' },
    linux: { color: 'orange', displayName: 'Linux' },
    other: { color: 'gray', displayName: 'Other' }
  };
  
  return platformMap[platform] || platformMap.other;
};

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

  const fetchApps = useCallback(async () => {
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
  }, [toast]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

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
          <VStack spacing={4}>
            {groupAppsByBaseName(apps).map((group) => (
              <Card key={group.baseName} w="100%">
                <CardBody>
                  {group.apps.length === 1 ? (
                    // 單一應用程式，直接顯示
                    <Grid templateColumns="1fr auto" gap={4} alignItems="center">
                      <VStack align="start" spacing={2}>
                        <HStack>
                          <ViewIcon color="primary.500" />
                          <Text fontSize="lg" fontWeight="bold">
                            {group.apps[0].displayName}
                          </Text>
                          <Tag 
                            colorScheme={getPlatformInfo(group.apps[0].platform).color} 
                            size="sm"
                          >
                            {getPlatformInfo(group.apps[0].platform).displayName}
                          </Tag>
                        </HStack>
                        <HStack spacing={4}>
                          <HStack>
                            <Text fontSize="sm" color="gray.600">Deployments:</Text>
                            <Badge colorScheme="blue">
                              {group.apps[0].deployments?.length || 0}
                            </Badge>
                          </HStack>
                          <HStack>
                            <Text fontSize="sm" color="gray.600">Collaborators:</Text>
                            <Badge colorScheme="green">
                              {Object.keys(group.apps[0].collaborators || {}).length}
                            </Badge>
                          </HStack>
                        </HStack>
                      </VStack>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          colorScheme="brand"
                          leftIcon={<ViewIcon />}
                          onClick={() => handleViewDeployments(group.apps[0].name)}
                        >
                          Deployments
                        </Button>
                        <IconButton
                          aria-label="Edit app"
                          icon={<EditIcon />}
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditApp(group.apps[0])}
                        />
                        <IconButton
                          aria-label="Delete app"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => handleDeleteApp(group.apps[0].name)}
                        />
                      </HStack>
                    </Grid>
                  ) : (
                    // 多個應用程式，使用可摺疊介面
                    <Accordion allowToggle>
                      <AccordionItem border="none">
                        <AccordionButton px={0} _hover={{ bg: "transparent" }}>
                          <HStack flex="1">
                            <ViewIcon color="primary.500" />
                            <Text fontSize="lg" fontWeight="bold">
                              {group.baseName}
                            </Text>
                            <HStack spacing={1}>
                              {group.apps.map((app) => (
                                <Tag 
                                  key={app.name}
                                  colorScheme={getPlatformInfo(app.platform).color} 
                                  size="sm"
                                >
                                  {getPlatformInfo(app.platform).displayName}
                                </Tag>
                              ))}
                            </HStack>
                            <Spacer />
                            <Text fontSize="sm" color="gray.500">
                              {group.apps.length} platforms
                            </Text>
                          </HStack>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel px={0} pt={4}>
                          <VStack spacing={3}>
                            {group.apps.map((app) => (
                              <Card key={app.name} size="sm" w="100%" bg="gray.50">
                                <CardBody>
                                  <Grid templateColumns="1fr auto" gap={4} alignItems="center">
                                    <VStack align="start" spacing={1}>
                                      <HStack>
                                        <Text fontWeight="semibold">
                                          {app.displayName}
                                        </Text>
                                        <Tag 
                                          colorScheme={getPlatformInfo(app.platform).color} 
                                          size="sm"
                                        >
                                          {getPlatformInfo(app.platform).displayName}
                                        </Tag>
                                      </HStack>
                                      <HStack spacing={4}>
                                        <HStack>
                                          <Text fontSize="sm" color="gray.600">Deployments:</Text>
                                          <Badge colorScheme="blue" size="sm">
                                            {app.deployments?.length || 0}
                                          </Badge>
                                        </HStack>
                                        <HStack>
                                          <Text fontSize="sm" color="gray.600">Collaborators:</Text>
                                          <Badge colorScheme="green" size="sm">
                                            {Object.keys(app.collaborators || {}).length}
                                          </Badge>
                                        </HStack>
                                      </HStack>
                                    </VStack>
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
                                  </Grid>
                                </CardBody>
                              </Card>
                            ))}
                          </VStack>
                        </AccordionPanel>
                      </AccordionItem>
                    </Accordion>
                  )}
                </CardBody>
              </Card>
            ))}
          </VStack>
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
