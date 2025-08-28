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
  Badge,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import { FiHome, FiActivity, FiUsers, FiKey, FiTool } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { CorsSettings } from "./CorsSettings";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  key: string;
  label: string;
  path: string;
  icon?: React.ReactElement;
  badge?: string;
  comingSoon?: boolean;
}

const navItems: NavItem[] = [
  {
    key: "/apps",
    label: "Applications",
    path: "/apps",
    icon: <FiHome size={18} />,
  },
  {
    key: "/account",
    label: "Account",
    path: "/account",
    icon: <FiUsers size={18} />,
  },
  {
    key: "/access-keys",
    label: "Access Keys",
    path: "/access-keys",
    icon: <FiKey size={18} />,
  },
  {
    key: "/metrics",
    label: "Analytics",
    path: "/metrics",
    icon: <FiActivity size={18} />,
  },
  {
    key: "/debug",
    label: "Debug Tools",
    path: "/debug",
    icon: <FiTool size={18} />,
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

  const isActivePath = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const NavContent = () => (
    <VStack spacing={1} align="stretch" w="100%">
      {navItems.map((item) => (
        <Button
          key={item.key}
          variant={isActivePath(item.path) ? "solid" : "ghost"}
          colorScheme={isActivePath(item.path) ? "brand" : "gray"}
          justifyContent="flex-start"
          leftIcon={item.icon}
          onClick={() => {
            navigate(item.path);
            onClose();
          }}
          w="100%"
          h="auto"
          py={3}
          px={3}
          cursor="pointer"
          position="relative"
          borderRadius="lg"
          fontSize="sm"
          fontWeight={isActivePath(item.path) ? "semibold" : "medium"}
          _hover={{
            bg: isActivePath(item.path) ? undefined : "gray.100",
            transform: "translateX(2px)",
            transition: "all 0.2s ease-in-out",
          }}
          _active={{
            transform: "translateX(1px)",
          }}
          transition="all 0.2s ease-in-out"
        >
          <Flex justify="space-between" align="center" w="100%">
            <Text>{item.label}</Text>
            {item.badge && (
              <Badge 
                size="sm" 
                colorScheme={isActivePath(item.path) ? "white" : "green"} 
                variant={isActivePath(item.path) ? "solid" : "subtle"}
              >
                {item.badge}
              </Badge>
            )}
          </Flex>
        </Button>
      ))}
    </VStack>
  );

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box
        bg="white"
        shadow="sm"
        borderBottom="1px"
        borderColor="gray.200"
        px={{ base: 4, md: 6 }}
        py={4}
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Flex justify="space-between" align="center">
          <HStack spacing={{ base: 2, md: 4 }}>
            {isMobile && (
              <IconButton
                aria-label="Open menu"
                icon={<HamburgerIcon />}
                onClick={onOpen}
                variant="ghost"
                size="md"
              />
            )}
            <Heading 
              size={{ base: "md", md: "lg" }} 
              color="primary.600"
              fontSize={{ base: "xl", md: "2xl" }}
            >
              CodePush Admin
            </Heading>
          </HStack>

          <HStack spacing={{ base: 2, md: 4 }}>
            <CorsSettings />
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              size={{ base: "sm", md: "md" }}
            >
              Logout
            </Button>
          </HStack>
        </Flex>
      </Box>

      <Flex>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Box
            w={{ base: "200px", lg: "240px", xl: "260px" }}
            bg="white"
            borderRight="1px"
            borderColor="gray.200"
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

        {/* Mobile Drawer */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent maxW="280px">
            <DrawerCloseButton />
            <DrawerHeader 
              borderBottomWidth="1px" 
              borderColor="gray.200"
              color="primary.600"
              fontWeight="bold"
            >
              Navigation
            </DrawerHeader>
            <DrawerBody p={4}>
              <NavContent />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Main Content */}
        <Box 
          flex={1} 
          p={{ base: 4, md: 6 }}
          minH="calc(100vh - 73px)"
          bg="gray.50"
        >
          <Box maxW="7xl" mx="auto">
            {children}
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};
