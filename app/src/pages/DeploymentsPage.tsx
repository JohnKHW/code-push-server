import { useState, useEffect, useRef, useCallback } from "react";
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
  Select,
  Textarea,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
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
  Tag,
  Card,
  CardBody,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Grid,
  Flex,
  Spacer,
} from "@chakra-ui/react";
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  ArrowBackIcon,
  AttachmentIcon,
  TimeIcon,
  RepeatIcon,
} from "@chakra-ui/icons";
import { FiUsers, FiArrowUp } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { http } from "../api/http";
import { formatDateTime, fromNow } from "../utils/datetime";
import { CollaboratorsManager } from "../components/CollaboratorsManager";

interface Deployment {
  name: string;
  key: string;
  package?: unknown;
}

interface Release {
  appVersion: string;
  description?: string;
  label?: string;
  packageHash: string;
  blobUrl: string;
  size: number;
  uploadTime: number;
  isMandatory?: boolean;
  isDisabled?: boolean;
  rollout?: number;
  releasedBy?: string;
  releaseMethod?: string;
  originalLabel?: string;
  originalDeployment?: string;
}

interface DeploymentResponse {
  [key: string]: {
    key?: string;
    package?: unknown;
  };
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

export const DeploymentsPage = () => {
  const { appName } = useParams<{ appName: string }>();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [releases, setReleases] = useState<Record<string, Release[]>>({});
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isReleaseOpen,
    onOpen: onReleaseOpen,
    onClose: onReleaseClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isCollaboratorOpen,
    onOpen: onCollaboratorOpen,
    onClose: onCollaboratorClose,
  } = useDisclosure();
  const {
    isOpen: isPromoteOpen,
    onOpen: onPromoteOpen,
    onClose: onPromoteClose,
  } = useDisclosure();

  const [editingDeployment, setEditingDeployment] = useState<Deployment | null>(
    null
  );
  const [selectedDeployment, setSelectedDeployment] = useState<string>("");
  const [deletingDeployment, setDeletingDeployment] = useState<string>("");
  const [deploymentName, setDeploymentName] = useState("");

  // Release form state
  const [releaseData, setReleaseData] = useState({
    appVersion: "",
    description: "",
    rollout: 100,
    isMandatory: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);



  // Promote form state
  const [promoteFromDeployment, setPromoteFromDeployment] = useState("");
  const [promoteToDeployment, setPromoteToDeployment] = useState("");

  const navigate = useNavigate();
  const toast = useToast();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDeployments = useCallback(async () => {
    if (!appName) return;

    try {
      setLoading(true);
      console.log(`Fetching deployments for app: ${appName}`);
      const response = await http.get(
        `/apps/${encodeURIComponent(appName)}/deployments`
      );
      console.log("Deployments API Response:", response);
      console.log("Deployments data:", response.data);

      // 處理 API 響應格式 - 後端返回 { deployments: Deployment[] }
      let deploymentsData: Deployment[] = [];

      if (response.data) {
        // 檢查是否是標準的 { deployments: [] } 格式
        if (
          "deployments" in response.data &&
          Array.isArray(response.data.deployments)
        ) {
          deploymentsData = response.data.deployments.map(
            (deployment: Record<string, unknown>) => ({
              name: (deployment.name as string) || "",
              key:
                (deployment.key as string) || (deployment.name as string) || "",
              package: deployment.package,
            })
          );
        } else if (Array.isArray(response.data)) {
          // 兼容直接返回數組的情況
          deploymentsData = response.data.map(
            (deployment: Record<string, unknown>) => ({
              name: (deployment.name as string) || "",
              key:
                (deployment.key as string) || (deployment.name as string) || "",
              package: deployment.package,
            })
          );
        } else if (typeof response.data === "object") {
          // 兼容對象格式
          deploymentsData = Object.entries(
            response.data as DeploymentResponse
          ).map(([deploymentName, deploymentDetails]) => ({
            name: deploymentName,
            key: deploymentDetails?.key || deploymentName,
            package: deploymentDetails?.package,
          }));
        }
      }

      console.log("Processed deployments data:", deploymentsData);

      // 調試：查看每個部署的 package 內容
      deploymentsData.forEach((deployment) => {
        console.log(
          `Deployment ${deployment.name} package:`,
          deployment.package
        );
      });

      setDeployments(deploymentsData);

      // 獲取每個部署的發佈歷史
      const releasesData: Record<string, Release[]> = {};
      for (const deployment of deploymentsData) {
        try {
          console.log(`Fetching history for deployment: ${deployment.name}`);
          const historyResponse = await http.get(
            `/apps/${encodeURIComponent(
              appName
            )}/deployments/${encodeURIComponent(deployment.name)}/history`
          );
          console.log(`History for ${deployment.name}:`, historyResponse.data);

          // 處理歷史數據格式 - 後端返回 { history: Package[] }
          let historyData: Release[] = [];

          if (historyResponse.data) {
            if (
              "history" in historyResponse.data &&
              Array.isArray(historyResponse.data.history)
            ) {
              // 標準格式：{ history: Package[] }
              console.log(
                `Found history array for ${deployment.name}:`,
                historyResponse.data.history
              );
              historyData = historyResponse.data.history;
            } else if (Array.isArray(historyResponse.data)) {
              // 兼容直接返回數組的情況
              console.log(
                `Found direct array for ${deployment.name}:`,
                historyResponse.data
              );
              historyData = historyResponse.data;
            } else if (
              historyResponse.data &&
              typeof historyResponse.data === "object"
            ) {
              // 兼容單個對象的情況
              console.log(
                `Found single object for ${deployment.name}:`,
                historyResponse.data
              );
              historyData = [historyResponse.data as Release];
            }
          }

          // 按上傳時間降序排序 (最新的在前)
          historyData.sort((a, b) => (b.uploadTime || 0) - (a.uploadTime || 0));

          console.log(
            `Processed and sorted history data for ${deployment.name}:`,
            historyData
          );
          releasesData[deployment.name] = historyData;
        } catch (error: unknown) {
          const apiError = error as ApiError;
          console.error(
            `Failed to fetch history for ${deployment.name}:`,
            apiError
          );
          releasesData[deployment.name] = [];
        }
      }

      console.log("All releases data:", releasesData);
      setReleases(releasesData);



      if (deploymentsData.length === 0) {
        toast({
          title: "No deployments found",
          description: "Create your first deployment!",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error("Fetch deployments error:", apiError);
      console.error("Error response:", apiError.response);

      if (apiError.response?.status === 401) {
        toast({
          title: "Authentication failed",
          description: "Please check your Access Key.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else if (apiError.response?.status === 404) {
        toast({
          title: "App not found",
          description: `App "${appName}" not found. Please verify the app name and ensure you have access.`,
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        // 對於 404 錯誤，設置空的部署列表而不是繼續拋出錯誤
        setDeployments([]);
        setReleases({});
      } else {
        toast({
          title: "Failed to fetch deployments",
          description: apiError.message || "Unknown error occurred",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [appName, toast]);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  const handleCreateDeployment = () => {
    setEditingDeployment(null);
    setDeploymentName("");
    onOpen();
  };

  const handleEditDeployment = (deployment: Deployment) => {
    setEditingDeployment(deployment);
    setDeploymentName(deployment.name);
    onOpen();
  };

  const handleDeleteDeployment = (deploymentName: string) => {
    setDeletingDeployment(deploymentName);
    onDeleteOpen();
  };

  const confirmDeleteDeployment = async () => {
    if (!appName) return;

    try {
      await http.delete(
        `/apps/${encodeURIComponent(appName)}/deployments/${encodeURIComponent(
          deletingDeployment
        )}`
      );
      toast({
        title: "Deployment deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchDeployments();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "Failed to delete deployment",
        description: apiError.response?.data?.message || apiError.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Delete deployment error:", apiError);
    } finally {
      onDeleteClose();
      setDeletingDeployment("");
    }
  };

  const handleSubmitDeployment = async () => {
    if (!appName || !deploymentName.trim()) return;

    try {
      if (editingDeployment) {
        await http.patch(
          `/apps/${encodeURIComponent(
            appName
          )}/deployments/${encodeURIComponent(editingDeployment.name)}`,
          {
            name: deploymentName,
          }
        );
        toast({
          title: "Deployment renamed successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        await http.post(`/apps/${encodeURIComponent(appName)}/deployments`, {
          name: deploymentName,
        });
        toast({
          title: "Deployment created successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      onClose();
      fetchDeployments();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage =
        apiError.response?.data?.message ||
        (editingDeployment
          ? "Failed to rename deployment"
          : "Failed to create deployment");
      toast({
        title: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCreateRelease = (deploymentName: string) => {
    setSelectedDeployment(deploymentName);
    setReleaseData({
      appVersion: "",
      description: "",
      rollout: 100,
      isMandatory: false,
    });
    setSelectedFile(null);
    onReleaseOpen();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmitRelease = async () => {
    if (
      !appName ||
      !selectedDeployment ||
      !selectedFile ||
      !releaseData.appVersion
    ) {
      toast({
        title: "Please fill all required fields",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("package", selectedFile);
      formData.append(
        "packageInfo",
        JSON.stringify({
          appVersion: releaseData.appVersion,
          description: releaseData.description || "",
          isMandatory: releaseData.isMandatory,
          rollout: releaseData.rollout,
        })
      );

      await http.post(
        `/apps/${encodeURIComponent(appName)}/deployments/${encodeURIComponent(
          selectedDeployment
        )}/release`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast({
        title: "Release created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onReleaseClose();
      fetchDeployments();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "Failed to create release",
        description: apiError.response?.data?.message || apiError.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Create release error:", apiError);
    }
  };

  const handleRollback = async (
    deploymentName: string,
    targetLabel: string
  ) => {
    if (!appName) return;

    try {
      await http.post(
        `/apps/${encodeURIComponent(appName)}/deployments/${encodeURIComponent(
          deploymentName
        )}/rollback`,
        {
          targetRelease: targetLabel,
        }
      );
      toast({
        title: "Rollback completed successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchDeployments();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "Failed to rollback",
        description: apiError.response?.data?.message || apiError.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Rollback error:", apiError);
    }
  };



  const handlePromote = async () => {
    if (!appName || !promoteFromDeployment || !promoteToDeployment) {
      toast({
        title: "Please select both source and destination deployments",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await http.post(
        `/apps/${encodeURIComponent(appName)}/deployments/${encodeURIComponent(
          promoteFromDeployment
        )}/promote/${encodeURIComponent(promoteToDeployment)}`
      );
      toast({
        title: "Promotion completed successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setPromoteFromDeployment("");
      setPromoteToDeployment("");
      onPromoteClose();
      fetchDeployments();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "Failed to promote",
        description: apiError.response?.data?.message || apiError.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Promote error:", apiError);
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <HStack spacing={4}>
          <Button
            leftIcon={<ArrowBackIcon />}
            variant="ghost"
            onClick={() => navigate("/apps")}
          >
            Back to Apps
          </Button>
          <Heading size="lg" color="primary.600">
            Deployments for {appName}
          </Heading>
        </HStack>
        <HStack spacing={3}>
          <Button
            leftIcon={<FiUsers />}
            variant="outline"
            onClick={onCollaboratorOpen}
          >
            Collaborators
          </Button>
          <Button
            leftIcon={<FiArrowUp />}
            variant="outline"
            onClick={onPromoteOpen}
            isDisabled={deployments.length < 2}
          >
            Promote
          </Button>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="brand"
            onClick={handleCreateDeployment}
          >
            Create Deployment
          </Button>
        </HStack>
      </HStack>

      <Box bg="white" rounded="md" shadow="sm" p={6}>
        {loading ? (
          <Center py={12}>
            <VStack spacing={4}>
              <Spinner size="lg" color="primary.500" />
              <Text color="gray.500">Loading deployments...</Text>
            </VStack>
          </Center>
        ) : deployments.length === 0 ? (
          <Center py={12}>
            <VStack spacing={4}>
              <Text fontSize="lg" color="gray.500">
                No deployments found
              </Text>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="brand"
                onClick={handleCreateDeployment}
              >
                Create Your First Deployment
              </Button>
            </VStack>
          </Center>
        ) : (
          <VStack spacing={4}>
            {deployments.map((deployment) => {
              const deploymentReleases = releases[deployment.name] || [];

              // 當前版本應該基於 deployment.package，而不是歷史記錄的第一個
              const currentPackage = deployment.package as Release | undefined;
              const latestRelease = currentPackage || deploymentReleases[0];

              return (
                <Card key={deployment.name} w="100%">
                  <CardBody>
                    <Grid
                      templateColumns="1fr auto"
                      gap={4}
                      alignItems="center"
                    >
                      <VStack align="start" spacing={2}>
                        <HStack>
                          <Text fontSize="lg" fontWeight="bold">
                            {deployment.name}
                          </Text>
                          {currentPackage && currentPackage.label && (
                            <Tag colorScheme="green" size="sm">
                              Current: {currentPackage.label}
                            </Tag>
                          )}
                          {!currentPackage &&
                            latestRelease &&
                            latestRelease.label && (
                              <Tag colorScheme="gray" size="sm">
                                Latest: {latestRelease.label}
                              </Tag>
                            )}
                        </HStack>

                        {currentPackage || latestRelease ? (
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm" color="gray.600">
                              {currentPackage ? "Current" : "Latest"} Version:{" "}
                              {(currentPackage || latestRelease)?.appVersion} •{" "}
                              {fromNow(
                                (currentPackage || latestRelease)?.uploadTime
                              )}
                            </Text>
                            <HStack>
                              {(currentPackage || latestRelease)?.isDisabled ? (
                                <Badge colorScheme="red">Disabled</Badge>
                              ) : (
                                <Badge colorScheme="green">
                                  Active (
                                  {(currentPackage || latestRelease)?.rollout ||
                                    100}
                                  %)
                                </Badge>
                              )}
                              {(currentPackage || latestRelease)
                                ?.isMandatory && (
                                <Badge colorScheme="orange">Mandatory</Badge>
                              )}
                            </HStack>
                          </VStack>
                        ) : (
                          <Text fontSize="sm" color="gray.500">
                            No releases
                          </Text>
                        )}
                      </VStack>

                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          colorScheme="brand"
                          leftIcon={<AttachmentIcon />}
                          onClick={() => handleCreateRelease(deployment.name)}
                        >
                          Release
                        </Button>
                        <IconButton
                          aria-label="Edit deployment"
                          icon={<EditIcon />}
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditDeployment(deployment)}
                        />
                        <IconButton
                          aria-label="Delete deployment"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() =>
                            handleDeleteDeployment(deployment.name)
                          }
                        />
                      </HStack>
                    </Grid>

                    {deploymentReleases.length > 0 && (
                      <Box mt={4}>
                        <Accordion allowToggle>
                          <AccordionItem border="none">
                            <AccordionButton
                              px={0}
                              _hover={{ bg: "transparent" }}
                            >
                              <HStack>
                                <TimeIcon color="gray.500" />
                                <Text fontWeight="medium">Release History</Text>
                              </HStack>
                              <Spacer />
                              <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel px={0} pt={4}>
                              <VStack spacing={3}>
                                {deploymentReleases.map((release, index) => (
                                  <Card
                                    key={release.label}
                                    size="sm"
                                    w="100%"
                                    bg="gray.50"
                                  >
                                    <CardBody>
                                      <Flex
                                        justify="space-between"
                                        align="start"
                                      >
                                        <VStack align="start" spacing={1}>
                                          <HStack>
                                            <Tag
                                              colorScheme={
                                                index === 0 ? "green" : "gray"
                                              }
                                              size="sm"
                                            >
                                              {release.label ||
                                                `v${release.appVersion}`}
                                            </Tag>
                                            <Text
                                              fontWeight="bold"
                                              fontSize="sm"
                                            >
                                              {release.appVersion}
                                            </Text>
                                            {release.isMandatory && (
                                              <Badge
                                                colorScheme="red"
                                                size="sm"
                                              >
                                                Mandatory
                                              </Badge>
                                            )}
                                            {release.isDisabled && (
                                              <Badge
                                                colorScheme="gray"
                                                size="sm"
                                              >
                                                Disabled
                                              </Badge>
                                            )}
                                          </HStack>
                                          <Text fontSize="sm" color="gray.600">
                                            {release.description ||
                                              "No description"}
                                          </Text>
                                          <Text fontSize="xs" color="gray.500">
                                            Rollout: {release.rollout || 100}% •
                                            Size:{" "}
                                            {(release.size / 1024).toFixed(1)}{" "}
                                            KB •{" "}
                                            {formatDateTime(release.uploadTime)}
                                          </Text>
                                        </VStack>
                                        {index > 0 && (
                                          <Button
                                            size="sm"
                                            leftIcon={<RepeatIcon />}
                                            variant="outline"
                                            onClick={() =>
                                              handleRollback(
                                                deployment.name,
                                                release.label || ""
                                              )
                                            }
                                          >
                                            Rollback
                                          </Button>
                                        )}
                                      </Flex>
                                    </CardBody>
                                  </Card>
                                ))}
                              </VStack>
                            </AccordionPanel>
                          </AccordionItem>
                        </Accordion>
                      </Box>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </VStack>
        )}
      </Box>

      {/* Create/Edit Deployment Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingDeployment ? "Rename Deployment" : "Create New Deployment"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>Deployment Name</FormLabel>
              <Input
                value={deploymentName}
                onChange={(e) => setDeploymentName(e.target.value)}
                placeholder="e.g., Production, Staging"
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
              <Button colorScheme="brand" onClick={handleSubmitDeployment}>
                {editingDeployment ? "Rename" : "Create"}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Release Modal */}
      <Modal isOpen={isReleaseOpen} onClose={onReleaseClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Release for {selectedDeployment}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Package File</FormLabel>
                <Input
                  type="file"
                  accept=".zip,.tar.gz"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  display="none"
                />
                <Button
                  leftIcon={<AttachmentIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  w="100%"
                >
                  {selectedFile ? selectedFile.name : "Select Package File"}
                </Button>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>App Version</FormLabel>
                <Input
                  value={releaseData.appVersion}
                  onChange={(e) =>
                    setReleaseData((prev) => ({
                      ...prev,
                      appVersion: e.target.value,
                    }))
                  }
                  placeholder="e.g., 1.0.0"
                  focusBorderColor="primary.500"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={releaseData.description}
                  onChange={(e) =>
                    setReleaseData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe what's new in this release"
                  rows={3}
                  focusBorderColor="primary.500"
                />
              </FormControl>

              <Grid templateColumns="1fr 1fr" gap={4} w="100%">
                <FormControl>
                  <FormLabel>Rollout Percentage</FormLabel>
                  <NumberInput
                    value={releaseData.rollout}
                    onChange={(valueString) =>
                      setReleaseData((prev) => ({
                        ...prev,
                        rollout: parseInt(valueString) || 100,
                      }))
                    }
                    min={1}
                    max={100}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Mandatory Update</FormLabel>
                  <Switch
                    isChecked={releaseData.isMandatory}
                    onChange={(e) =>
                      setReleaseData((prev) => ({
                        ...prev,
                        isMandatory: e.target.checked,
                      }))
                    }
                    colorScheme="brand"
                    size="lg"
                    mt={2}
                  />
                </FormControl>
              </Grid>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onReleaseClose}>
                Cancel
              </Button>
              <Button colorScheme="brand" onClick={handleSubmitRelease}>
                Create Release
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
              Delete Deployment
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete "{deletingDeployment}"? This
              action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={confirmDeleteDeployment}
                ml={3}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Collaborators Modal */}
      <CollaboratorsManager
        appName={appName || ""}
        isOpen={isCollaboratorOpen}
        onClose={onCollaboratorClose}
        onUpdate={fetchDeployments}
      />

      {/* Promote Modal */}
      <Modal isOpen={isPromoteOpen} onClose={onPromoteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Promote Release</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text color="gray.600">
                Promote the latest release from one deployment to another.
              </Text>
              
              <FormControl isRequired>
                <FormLabel>From Deployment (Source)</FormLabel>
                <Select
                  placeholder="Select source deployment"
                  value={promoteFromDeployment}
                  onChange={(e) => setPromoteFromDeployment(e.target.value)}
                  focusBorderColor="primary.500"
                >
                  {deployments.map((deployment) => (
                    <option key={deployment.name} value={deployment.name}>
                      {deployment.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>To Deployment (Destination)</FormLabel>
                <Select
                  placeholder="Select destination deployment"
                  value={promoteToDeployment}
                  onChange={(e) => setPromoteToDeployment(e.target.value)}
                  focusBorderColor="primary.500"
                >
                  {deployments
                    .filter((deployment) => deployment.name !== promoteFromDeployment)
                    .map((deployment) => (
                      <option key={deployment.name} value={deployment.name}>
                        {deployment.name}
                      </option>
                    ))}
                </Select>
              </FormControl>

              {promoteFromDeployment && promoteToDeployment && (
                <Card bg="blue.50" w="100%">
                  <CardBody>
                    <Text fontSize="sm" color="blue.800">
                      This will copy the latest release from "{promoteFromDeployment}" to "{promoteToDeployment}".
                    </Text>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onPromoteClose}>
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                onClick={handlePromote}
                isDisabled={!promoteFromDeployment || !promoteToDeployment}
              >
                Promote
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};
