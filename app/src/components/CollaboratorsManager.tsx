import {
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
  useToast,
  Text,
  Badge,
  Card,
  CardBody,
  Flex,
  Avatar,
  Box,
  Divider,
  IconButton,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FiUsers,
  FiPlus,
  FiTrash2,
  FiMail,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { useState, useEffect } from "react";
import { http } from "../api/http";

interface Collaborator {
  email: string;
  permission: string;
  createdTime: number;
  friendlyName?: string;
  isCurrentAccount?: boolean;
}

interface CollaboratorsManagerProps {
  appName: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
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

export const CollaboratorsManager = ({
  appName,
  isOpen,
  onClose,
  onUpdate,
}: CollaboratorsManagerProps) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [addingCollaborator, setAddingCollaborator] = useState(false);
  const toast = useToast();

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const currentUserBg = useColorModeValue("blue.50", "blue.900");
  const currentUserBorder = useColorModeValue("blue.200", "blue.600");

  const fetchCollaborators = async () => {
    if (!appName) return;

    try {
      setLoading(true);
      const response = await http.get(
        `/apps/${encodeURIComponent(appName)}/collaborators`
      );

      if (
        response.data?.collaborators &&
        typeof response.data.collaborators === "object"
      ) {
        const collaboratorEntries = Object.entries(
          response.data.collaborators
        ).map(([email, data]: [string, unknown]) => {
          const collaboratorData = data as Record<string, unknown>;
          return {
            email,
            permission:
              (collaboratorData?.permission as string) || "Collaborator",
            createdTime: Date.now(),
            friendlyName: undefined,
            isCurrentAccount:
              (collaboratorData?.isCurrentAccount as boolean) || false,
          };
        });
        setCollaborators(collaboratorEntries);
      } else {
        setCollaborators([]);
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.warn("Failed to fetch collaborators:", apiError);
      if (apiError.response?.status !== 404) {
        toast({
          title: "Warning",
          description: "Failed to load collaborators",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      }
      setCollaborators([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCollaborators();
    }
  }, [isOpen, appName]);

  const handleAddCollaborator = async () => {
    if (!appName || !collaboratorEmail.trim()) {
      toast({
        title: "Please enter a valid email",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setAddingCollaborator(true);
      await http.post(
        `/apps/${encodeURIComponent(
          appName
        )}/collaborators/${encodeURIComponent(collaboratorEmail)}`
      );
      toast({
        title: "Collaborator added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setCollaboratorEmail("");
      fetchCollaborators();
      onUpdate?.();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "Failed to add collaborator",
        description: apiError.response?.data?.message || apiError.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setAddingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = async (email: string) => {
    if (!appName) return;

    try {
      await http.delete(
        `/apps/${encodeURIComponent(
          appName
        )}/collaborators/${encodeURIComponent(email)}`
      );
      toast({
        title: "Collaborator removed successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchCollaborators();
      onUpdate?.();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "Failed to remove collaborator",
        description: apiError.response?.data?.message || apiError.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getPermissionIcon = (permission: string) => {
    return permission === "Owner" ? <FiShield /> : <FiUser />;
  };

  const getPermissionColor = (permission: string) => {
    return permission === "Owner" ? "purple" : "green";
  };

  const sortedCollaborators = collaborators.sort((a, b) => {
    if (a.isCurrentAccount && !b.isCurrentAccount) return -1;
    if (!a.isCurrentAccount && b.isCurrentAccount) return 1;
    if (a.permission === "Owner" && b.permission !== "Owner") return -1;
    if (a.permission !== "Owner" && b.permission === "Owner") return 1;
    return a.email.localeCompare(b.email);
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxW="600px">
        <ModalHeader>
          <HStack>
            <FiUsers />
            <Text>Manage Collaborators</Text>
          </HStack>
          <Text fontSize="sm" fontWeight="normal" color="gray.500" mt={1}>
            {appName}
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Add Collaborator Section */}
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack>
                    <FiPlus />
                    <Heading size="sm">Invite New Collaborator</Heading>
                  </HStack>

                  <FormControl>
                    <FormLabel fontSize="sm">Email Address</FormLabel>
                    <HStack>
                      <Input
                        placeholder="Enter collaborator's email"
                        value={collaboratorEmail}
                        onChange={(e) => setCollaboratorEmail(e.target.value)}
                        focusBorderColor="primary.500"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleAddCollaborator();
                          }
                        }}
                      />
                      <Button
                        colorScheme="brand"
                        onClick={handleAddCollaborator}
                        isLoading={addingCollaborator}
                        loadingText="Adding..."
                        isDisabled={!collaboratorEmail.trim()}
                        leftIcon={<FiPlus />}
                      >
                        Invite
                      </Button>
                    </HStack>
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>

            {/* Collaborators List */}
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Heading size="sm">
                      Team Members ({collaborators.length})
                    </Heading>
                    {loading && (
                      <Text fontSize="xs" color="gray.500">
                        Loading...
                      </Text>
                    )}
                  </HStack>

                  <Divider />

                  {collaborators.length === 0 ? (
                    <Box textAlign="center" py={8}>
                      <FiUsers
                        size={48}
                        color="gray.400"
                        style={{ margin: "0 auto 16px" }}
                      />
                      <Text color="gray.500" fontSize="lg" fontWeight="medium">
                        No collaborators yet
                      </Text>
                      <Text color="gray.400" fontSize="sm" mt={1}>
                        Invite team members to start collaborating
                      </Text>
                    </Box>
                  ) : (
                    <VStack spacing={3} align="stretch">
                      {sortedCollaborators.map((collaborator, index) => (
                        <Box key={collaborator.email}>
                          <Flex
                            justify="space-between"
                            align="center"
                            p={4}
                            bg={
                              collaborator.isCurrentAccount
                                ? currentUserBg
                                : bgColor
                            }
                            borderWidth="1px"
                            borderColor={
                              collaborator.isCurrentAccount
                                ? currentUserBorder
                                : borderColor
                            }
                            rounded="lg"
                            _hover={{
                              shadow: "md",
                              transform: "translateY(-1px)",
                              transition: "all 0.2s ease-in-out",
                            }}
                            transition="all 0.2s ease-in-out"
                          >
                            <HStack spacing={4}>
                              <Avatar
                                size="md"
                                name={
                                  collaborator.friendlyName ||
                                  collaborator.email
                                }
                                bg={`${getPermissionColor(
                                  collaborator.permission
                                )}.500`}
                                color="white"
                              />

                              <VStack align="start" spacing={1}>
                                <HStack spacing={2}>
                                  <Text fontWeight="semibold" fontSize="md">
                                    {collaborator.friendlyName ||
                                      collaborator.email.split("@")[0]}
                                  </Text>

                                  {collaborator.isCurrentAccount && (
                                    <Badge
                                      colorScheme="blue"
                                      size="sm"
                                      fontWeight="medium"
                                    >
                                      You
                                    </Badge>
                                  )}

                                  <Badge
                                    colorScheme={getPermissionColor(
                                      collaborator.permission
                                    )}
                                    size="sm"
                                    fontWeight="medium"
                                  >
                                    <HStack spacing={1}>
                                      {getPermissionIcon(
                                        collaborator.permission
                                      )}
                                      <Text>{collaborator.permission}</Text>
                                    </HStack>
                                  </Badge>
                                </HStack>

                                <HStack
                                  spacing={1}
                                  color="gray.500"
                                  fontSize="sm"
                                >
                                  <FiMail size={12} />
                                  <Text>{collaborator.email}</Text>
                                </HStack>

                                {collaborator.isCurrentAccount && (
                                  <Text
                                    fontSize="xs"
                                    color="blue.600"
                                    fontWeight="medium"
                                  >
                                    This is your account
                                  </Text>
                                )}
                              </VStack>
                            </HStack>

                            {!collaborator.isCurrentAccount && (
                              <Tooltip
                                label="Remove collaborator"
                                placement="top"
                              >
                                <IconButton
                                  aria-label="Remove collaborator"
                                  icon={<FiTrash2 />}
                                  size="sm"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() =>
                                    handleRemoveCollaborator(collaborator.email)
                                  }
                                  _hover={{
                                    bg: "red.100",
                                    color: "red.600",
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Flex>

                          {index < sortedCollaborators.length - 1 && (
                            <Divider />
                          )}
                        </Box>
                      ))}
                    </VStack>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
