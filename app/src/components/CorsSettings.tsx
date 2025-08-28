import { useState } from 'react';
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
} from '@chakra-ui/react';
import { SettingsIcon, InfoIcon } from '@chakra-ui/icons';

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
      >
        CORS Settings
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <SettingsIcon />
              <Text>CORS 繞過設定</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={6}>
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">關於 CORS</Text>
                  <Text fontSize="sm">
                    CORS (跨域資源共享) 是瀏覽器的安全功能，限制不同域名之間的 HTTP 請求。以下提供多種繞過方法。
                  </Text>
                </Box>
              </Alert>

              {/* Development Proxy */}
              <Box w="100%" p={4} border="1px" borderColor="gray.200" rounded="md">
                <HStack justify="space-between" mb={3}>
                  <Box>
                    <Heading size="sm" mb={1}>開發代理 (推薦)</Heading>
                    <Text fontSize="sm" color="gray.600">在開發環境使用 Vite 代理自動處理 CORS</Text>
                  </Box>
                  <Switch
                    isChecked={settings.useProxy}
                    onChange={(e) => handleSettingChange('useProxy', e.target.checked)}
                    colorScheme="brand"
                  />
                </HStack>
                {settings.useProxy && (
                  <Box p={3} bg="green.50" rounded="md">
                    <Text color="green.700" fontSize="sm">
                      ✅ 已啟用 - 所有 API 請求將通過 Vite 代理處理
                    </Text>
                  </Box>
                )}
              </Box>

              {/* Public CORS Proxy */}
              <Box w="100%" p={4} border="1px" borderColor="gray.200" rounded="md">
                <HStack justify="space-between" mb={3}>
                  <Box>
                    <Heading size="sm" mb={1}>公共 CORS 代理</Heading>
                    <Text fontSize="sm" color="gray.600">使用第三方 CORS 代理服務 (不建議生產環境)</Text>
                  </Box>
                  <Switch
                    isChecked={settings.useCorsAnywhere}
                    onChange={(e) => handleSettingChange('useCorsAnywhere', e.target.checked)}
                    colorScheme="yellow"
                  />
                </HStack>
                {settings.useCorsAnywhere && (
                  <Box p={3} bg="yellow.50" rounded="md">
                    <Text color="yellow.700" fontSize="sm">
                      ⚠️ 已啟用 - 請注意這可能會影響性能和安全性
                    </Text>
                  </Box>
                )}
              </Box>

              {/* Browser Instructions */}
              <Box w="100%" p={4} border="1px" borderColor="gray.200" rounded="md">
                <HStack justify="space-between" mb={3}>
                  <Box>
                    <Heading size="sm" mb={1}>瀏覽器設定說明</Heading>
                    <Text fontSize="sm" color="gray.600">顯示如何在瀏覽器中完全禁用 CORS</Text>
                  </Box>
                  <Switch
                    isChecked={settings.showBrowserInstructions}
                    onChange={(e) => handleSettingChange('showBrowserInstructions', e.target.checked)}
                    colorScheme="orange"
                  />
                </HStack>
              </Box>

              {settings.showBrowserInstructions && (
                <Alert status="warning">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold" mb={2}>瀏覽器 CORS 禁用方法</Text>
                    <VStack align="start" spacing={3}>
                      <Box>
                        <Text fontWeight="semibold">Chrome:</Text>
                        <Text fontSize="sm">使用命令列啟動：</Text>
                        <Code fontSize="xs" p={2} display="block" mt={1}>
                          chrome --user-data-dir=/tmp/chrome_temp --disable-web-security --disable-features=VizDisplayCompositor
                        </Code>
                      </Box>
                      
                      <Box>
                        <Text fontWeight="semibold">Firefox:</Text>
                        <Text fontSize="sm">在位址列輸入 about:config，設定：</Text>
                        <Code fontSize="xs" p={2} display="block" mt={1}>
                          security.fileuri.strict_origin_policy = false
                        </Code>
                      </Box>

                      <Box>
                        <Text fontWeight="semibold">瀏覽器擴展:</Text>
                        <Text fontSize="sm">安裝 "CORS Unblock" 或 "Disable CORS" 擴展</Text>
                      </Box>
                    </VStack>
                  </Box>
                </Alert>
              )}

              <Divider />

              <Box w="100%">
                <HStack mb={4}>
                  <InfoIcon color="blue.500" />
                  <Heading size="sm">當前狀態</Heading>
                </HStack>
                
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Box p={3} bg="blue.50" rounded="md">
                      <Text fontWeight="bold" fontSize="sm">開發環境:</Text>
                      <Text fontSize="sm">使用 Vite 代理 (推薦)</Text>
                    </Box>
                  </GridItem>
                  <GridItem>
                    <Box p={3} bg="gray.50" rounded="md">
                      <Text fontWeight="bold" fontSize="sm">生產環境:</Text>
                      <Text fontSize="sm">需要後端設定 CORS 標頭</Text>
                    </Box>
                  </GridItem>
                </Grid>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="brand" onClick={onClose}>
              確定
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};