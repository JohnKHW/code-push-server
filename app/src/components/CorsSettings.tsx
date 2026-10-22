import { useState } from "react";
import {
  Box,
  Button,
  Switch,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  HStack,
  Text,
  Heading,
  Divider,
  Grid,
  GridItem,
  Code,
} from "@chakra-ui/react";
import { SettingsIcon, InfoIcon } from "@chakra-ui/icons";

interface CorsSettingsProps {
  onSettingsChange?: (settings: CorsSettings) => void;
}

interface CorsSettings {
  useProxy: boolean;
  useCorsAnywhere: boolean;
  showBrowserInstructions: boolean;
}

export const CorsSettings = ({ onSettingsChange }: CorsSettingsProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [settings, setSettings] = useState<CorsSettings>({
    useProxy: true,
    useCorsAnywhere: false,
    showBrowserInstructions: false,
  });

  const handleSettingChange = (key: keyof CorsSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  return (
    <>
      <Button
        leftIcon={<SettingsIcon />}
        onClick={onOpen}
        variant="ghost"
        size="sm"
        color="neutral.700"
        _hover={{ bg: "neutral.100" }}
        cursor="pointer"
        transition="background-color 0.2s ease"
      >
        CORS help
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <SettingsIcon />
              <Text>CORS and local development</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <VStack spacing={6}>
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">About CORS</Text>
                  <Text fontSize="sm" mt={1}>
                    Browsers block cross-origin requests unless the API sends permissive CORS headers.
                    Use a dev proxy or configure <Code fontSize="xs">CORS_ORIGIN</Code> on the server.
                  </Text>
                </Box>
              </Alert>

              <Box w="100%" p={4} border="1px" borderColor="neutral.200" rounded="md">
                <HStack justify="space-between" mb={3}>
                  <Box>
                    <Heading size="sm" mb={1}>
                      Vite dev proxy (recommended)
                    </Heading>
                    <Text fontSize="sm" color="neutral.600">
                      Requests to <Code fontSize="xs">/api</Code> are forwarded by{" "}
                      <Code fontSize="xs">vite.config.ts</Code> so the browser stays same-origin.
                    </Text>
                  </Box>
                  <Switch
                    isChecked={settings.useProxy}
                    onChange={(e) => handleSettingChange("useProxy", e.target.checked)}
                    colorScheme="brand"
                  />
                </HStack>
                {settings.useProxy && (
                  <Box p={3} bg="neutral.100" rounded="md">
                    <Text color="neutral.800" fontSize="sm">
                      When the saved server host matches the proxy target, the app uses <Code fontSize="xs">/api</Code>{" "}
                      automatically in development.
                    </Text>
                  </Box>
                )}
              </Box>

              <Box w="100%" p={4} border="1px" borderColor="neutral.200" rounded="md">
                <HStack justify="space-between" mb={3}>
                  <Box>
                    <Heading size="sm" mb={1}>
                      Public CORS proxy
                    </Heading>
                    <Text fontSize="sm" color="neutral.600">
                      Third-party proxies are risky for production and credentials. Avoid when possible.
                    </Text>
                  </Box>
                  <Switch
                    isChecked={settings.useCorsAnywhere}
                    onChange={(e) => handleSettingChange("useCorsAnywhere", e.target.checked)}
                    colorScheme="yellow"
                  />
                </HStack>
                {settings.useCorsAnywhere && (
                  <Box p={3} bg="yellow.50" rounded="md">
                    <Text color="yellow.900" fontSize="sm">
                      Only use for quick experiments. Do not send secrets you cannot rotate.
                    </Text>
                  </Box>
                )}
              </Box>

              <Box w="100%" p={4} border="1px" borderColor="neutral.200" rounded="md">
                <HStack justify="space-between" mb={3}>
                  <Box>
                    <Heading size="sm" mb={1}>
                      Browser-only workarounds
                    </Heading>
                    <Text fontSize="sm" color="neutral.600">
                      For local debugging only. Never rely on disabled security in production.
                    </Text>
                  </Box>
                  <Switch
                    isChecked={settings.showBrowserInstructions}
                    onChange={(e) =>
                      handleSettingChange("showBrowserInstructions", e.target.checked)
                    }
                    colorScheme="orange"
                  />
                </HStack>
              </Box>

              {settings.showBrowserInstructions && (
                <Alert status="warning">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Disabling CORS in the browser
                    </Text>
                    <VStack align="start" spacing={3}>
                      <Box>
                        <Text fontWeight="semibold">Chrome</Text>
                        <Text fontSize="sm">Launch with a separate user data dir and flags (dev only):</Text>
                        <Code fontSize="xs" p={2} display="block" mt={1} whiteSpace="pre-wrap">
                          chrome --user-data-dir=/tmp/chrome_dev --disable-web-security
                        </Code>
                      </Box>

                      <Box>
                        <Text fontWeight="semibold">Firefox</Text>
                        <Text fontSize="sm">
                          Advanced users may adjust <Code fontSize="xs">about:config</Code> for local testing only.
                        </Text>
                      </Box>
                    </VStack>
                  </Box>
                </Alert>
              )}

              <Divider borderColor="neutral.200" />

              <Box w="100%">
                <HStack mb={4}>
                  <InfoIcon color="brand.600" />
                  <Heading size="sm">Summary</Heading>
                </HStack>

                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Box p={3} bg="neutral.100" rounded="md">
                      <Text fontWeight="bold" fontSize="sm">
                        Development
                      </Text>
                      <Text fontSize="sm" color="neutral.700">
                        Prefer the Vite proxy and the default Gammon host, or set a custom URL and fix CORS on the API.
                      </Text>
                    </Box>
                  </GridItem>
                  <GridItem>
                    <Box p={3} bg="neutral.100" rounded="md">
                      <Text fontWeight="bold" fontSize="sm">
                        Production
                      </Text>
                      <Text fontSize="sm" color="neutral.700">
                        Host the admin on an origin allowed by <Code fontSize="xs">CORS_ORIGIN</Code> on CodePush.
                      </Text>
                    </Box>
                  </GridItem>
                </Grid>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button bg="brand.500" color="neutral.900" _hover={{ bg: "brand.400" }} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
