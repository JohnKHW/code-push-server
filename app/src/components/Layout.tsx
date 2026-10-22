import {
  Box,
  Flex,
  HStack,
  VStack,
  Heading,
  Button,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useBreakpointValue,
  Text,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import { FiHome, FiActivity, FiUsers, FiKey, FiTool } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { CorsSettings } from "./CorsSettings";
import type { ReactNode, ReactElement } from "react";

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  key: string;
  label: string;
  path: string;
  icon?: ReactElement;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Releases",
    items: [
      {
        key: "/apps",
        label: "Applications",
        path: "/apps",
        icon: <FiHome size={16} />,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        key: "/account",
        label: "Account",
        path: "/account",
        icon: <FiUsers size={16} />,
      },
      {
        key: "/access-keys",
        label: "Access Keys",
        path: "/access-keys",
        icon: <FiKey size={16} />,
      },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        key: "/metrics",
        label: "Analytics",
        path: "/metrics",
        icon: <FiActivity size={16} />,
      },
      {
        key: "/debug",
        label: "Debug Tools",
        path: "/debug",
        icon: <FiTool size={16} />,
      },
    ],
  },
];

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, lg: false });

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const isActivePath = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const NavContent = () => (
    <VStack spacing={6} align="stretch" w="100%">
      {navGroups.map((group) => (
        <Box key={group.label}>
          <Text
            px={3}
            mb={2}
            fontSize="xs"
            fontWeight="semibold"
            letterSpacing="0.08em"
            textTransform="uppercase"
            color="neutral.400"
          >
            {group.label}
          </Text>
          <VStack spacing={1} align="stretch">
            {group.items.map((item) => {
              const active = isActivePath(item.path);
              return (
                <Button
                  key={item.key}
                  variant="ghost"
                  justifyContent="flex-start"
                  leftIcon={item.icon}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  w="100%"
                  h="auto"
                  py={2.5}
                  px={3}
                  cursor="pointer"
                  borderRadius="md"
                  fontSize="sm"
                  fontWeight={active ? "semibold" : "medium"}
                  color={active ? "neutral.900" : "neutral.600"}
                  bg={active ? "brand.50" : "transparent"}
                  boxShadow={active ? "inset 3px 0 0 var(--chakra-colors-brand-500)" : "none"}
                  _hover={{
                    bg: active ? "brand.50" : "neutral.100",
                    color: "neutral.900",
                  }}
                  transition="background-color 0.2s ease, color 0.2s ease"
                >
                  {item.label}
                </Button>
              );
            })}
          </VStack>
        </Box>
      ))}
    </VStack>
  );

  return (
    <Box minH="100vh" bg="neutral.50">
      <Box
        bg="white"
        shadow="sm"
        borderBottom="1px"
        borderColor="neutral.200"
        px={{ base: 4, md: 6 }}
        py={4}
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Flex justify="space-between" align="center" maxW="100%">
          <HStack spacing={{ base: 2, md: 4 }}>
            {isMobile && (
              <IconButton
                aria-label="Open menu"
                icon={<HamburgerIcon />}
                onClick={onOpen}
                variant="ghost"
                size="md"
                color="neutral.800"
              />
            )}
            <HStack spacing={3}>
              <Box w="8px" h="8px" borderRadius="full" bg="brand.500" aria-hidden />
              <Heading
                size={{ base: "md", md: "lg" }}
                color="neutral.900"
                fontWeight="semibold"
                letterSpacing="-0.02em"
              >
                CodePush
              </Heading>
            </HStack>
          </HStack>

          <HStack spacing={{ base: 2, md: 4 }}>
            <CorsSettings />
            <Button
              variant="ghost"
              onClick={handleLogout}
              size={{ base: "sm", md: "md" }}
              color="neutral.700"
              _hover={{ bg: "neutral.100", color: "neutral.900" }}
              transition="background-color 0.2s ease, color 0.2s ease"
            >
              Log out
            </Button>
          </HStack>
        </Flex>
      </Box>

      <Flex>
        {!isMobile && (
          <Box
            w={{ base: "200px", lg: "240px", xl: "260px" }}
            bg="white"
            borderRight="1px"
            borderColor="neutral.200"
            minH="calc(100vh - 73px)"
            p={4}
            position="sticky"
            top="73px"
            overflowY="auto"
            maxH="calc(100vh - 73px)"
          >
            <NavContent />
          </Box>
        )}

        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent maxW="280px">
            <DrawerCloseButton />
            <DrawerHeader
              borderBottomWidth="1px"
              borderColor="neutral.200"
              color="neutral.900"
              fontWeight="semibold"
            >
              Navigation
            </DrawerHeader>
            <DrawerBody p={4}>
              <NavContent />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        <Box flex={1} p={{ base: 4, md: 6 }} minH="calc(100vh - 73px)" bg="neutral.50">
          <Box maxW="7xl" mx="auto">
            {children}
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};
