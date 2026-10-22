import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import {
  Box,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Button,
  Heading,
  Text,
  VStack,
  Alert,
  AlertIcon,
  Container,
  useToast,
  Link,
  Collapse,
  useDisclosure,
  HStack,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { http } from '../api/http';
import {
  CODEPUSH_SERVER_STORAGE_KEY,
  DEFAULT_CODEPUSH_SERVER_URL,
  persistCodePushServerUrl,
} from '../api/serverUrl';
import { buildCliExternalAuthUrl } from '../utils/cliAuthUrl';
import { watchOAuthPopup } from '../utils/oauthPopup';

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const CLI_HOSTNAME_STORAGE_KEY = 'codepushCliHostname';

function defaultCliHostname(): string {
  if (typeof window === 'undefined') return 'browser';
  return window.location.hostname || 'browser';
}

export const AuthPage = () => {
  const [serverUrl, setServerUrl] = useState(DEFAULT_CODEPUSH_SERVER_URL);
  const [cliHostname, setCliHostname] = useState(defaultCliHostname);
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthPending, setOauthPending] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen: manualOpen, onToggle: onManualToggle } = useDisclosure();
  const oauthCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      oauthCleanupRef.current?.();
    };
  }, []);

  useEffect(() => {
    const storedServer = localStorage.getItem(CODEPUSH_SERVER_STORAGE_KEY);
    if (storedServer) setServerUrl(storedServer);
    const storedHost = localStorage.getItem(CLI_HOSTNAME_STORAGE_KEY);
    if (storedHost) setCliHostname(storedHost);
  }, []);

  const persistHostname = (value: string) => {
    setCliHostname(value);
    localStorage.setItem(CLI_HOSTNAME_STORAGE_KEY, value);
  };

  const verifyAndLogin = useCallback(
    async (key: string) => {
      const trimmed = key.trim();
      if (!trimmed) {
        setError('Please enter your Access Key.');
        return false;
      }

      setLoading(true);
      setError('');

      try {
        persistCodePushServerUrl(serverUrl);
        localStorage.setItem('accessKey', trimmed);

        const response = await http.get('/authenticated', {
          skipAuthRedirect: true,
        });

        if (response.status === 200) {
          login(trimmed);
          setOauthPending(false);
          toast({
            title: 'Signed in',
            description: 'Connected to CodePush.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          navigate('/apps', { replace: true });
          return true;
        }
      } catch (err: unknown) {
        const apiError = err as ApiError;
        localStorage.removeItem('accessKey');

        if (apiError.response?.status === 401) {
          setError('Invalid access key.');
        } else if (apiError.response?.status === 404) {
          setError('API not found. Check the server URL.');
        } else if (apiError.message === 'Network Error' || !apiError.response) {
          setError('Cannot reach the server. Check URL, VPN, and CORS.');
        } else {
          setError(
            `Request failed (${apiError.response?.status ?? 'unknown'}). ${apiError.message ?? ''}`.trim(),
          );
        }
      } finally {
        setLoading(false);
      }

      return false;
    },
    [login, navigate, serverUrl, toast],
  );

  const openBrowserLogin = () => {
    setError('');
    oauthCleanupRef.current?.();
    oauthCleanupRef.current = null;

    try {
      persistCodePushServerUrl(serverUrl);
      const url = buildCliExternalAuthUrl(serverUrl, 'login', cliHostname);
      const serverOrigin = new URL(url).origin;
      const popup = window.open(url, 'codepush_oauth', 'width=720,height=840');
      if (!popup) {
        setError(
          'Pop-up was blocked. Allow pop-ups for this site, or open the link manually (see below).',
        );
        return;
      }

      setOauthPending(true);
      const { cleanup } = watchOAuthPopup(popup, serverOrigin, (key) => {
        setAccessKey(key);
        void verifyAndLogin(key);
      });
      oauthCleanupRef.current = cleanup;
    } catch {
      setError('Invalid server URL.');
    }
  };

  const loginPageUrl = (() => {
    try {
      return buildCliExternalAuthUrl(serverUrl, 'login', cliHostname);
    } catch {
      return '';
    }
  })();

  const serverHost = (() => {
    try {
      return new URL(serverUrl).host;
    } catch {
      return '';
    }
  })();

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyAndLogin(accessKey);
  };

  return (
    <Box
      minH="100vh"
      bg="neutral.50"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
      py={{ base: 10, md: 16 }}
    >
      <Container maxW="md">
        <VStack spacing={8} align="stretch">
          <VStack spacing={3} align="flex-start">
            <HStack spacing={2}>
              <Box
                w="8px"
                h="8px"
                borderRadius="full"
                bg="brand.500"
                aria-hidden
              />
              <Text
                fontSize="xs"
                fontWeight="semibold"
                letterSpacing="0.14em"
                textTransform="uppercase"
                color="neutral.500"
              >
                CodePush
              </Text>
            </HStack>
            <Heading
              as="h1"
              fontSize={{ base: '2xl', md: '3xl' }}
              fontWeight="semibold"
              color="neutral.900"
              letterSpacing="-0.03em"
            >
              Sign in to publish updates
            </Heading>
            <Text color="neutral.600" fontSize="md" lineHeight="tall">
              Use the server login page, then paste the access key it shows.
            </Text>
          </VStack>

          <Card
            shadow="sm"
            borderWidth="1px"
            borderColor="neutral.200"
            rounded="xl"
            bg="white"
          >
            <CardBody p={{ base: 6, md: 8 }}>
              <VStack spacing={5} align="stretch">
                {error && (
                  <Alert status="error" rounded="md" variant="subtle">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}

                <FormControl>
                  <FormLabel color="neutral.800" fontWeight="medium">
                    Server URL
                  </FormLabel>
                  <Input
                    type="url"
                    placeholder={DEFAULT_CODEPUSH_SERVER_URL}
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    size="md"
                    fontSize="sm"
                    bg="white"
                    borderColor="neutral.200"
                    _hover={{ borderColor: 'neutral.300' }}
                    _focus={{
                      borderColor: 'brand.500',
                      boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                    }}
                    autoComplete="url"
                  />
                  <FormHelperText color="neutral.500">
                    {serverHost ||
                      'Enter the full server URL, including https://'}
                  </FormHelperText>
                </FormControl>

                <Button
                  size="lg"
                  w="100%"
                  bg="brand.500"
                  color="neutral.900"
                  fontWeight="semibold"
                  _hover={{ bg: 'brand.400' }}
                  _active={{ bg: 'brand.600' }}
                  onClick={openBrowserLogin}
                  isLoading={oauthPending && loading}
                  loadingText="Signing in…"
                >
                  Open server login
                </Button>

                {oauthPending ? (
                  <Text fontSize="sm" color="neutral.600" lineHeight="tall">
                    Finish sign-in in the pop-up, copy the access key, then come
                    back. If the pop-up closes, this page tries to read the key
                    from your clipboard.
                  </Text>
                ) : null}

                <Box as="form" onSubmit={handleManualSubmit}>
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel color="neutral.800" fontWeight="medium">
                        Access Key
                      </FormLabel>
                      <Input
                        type="password"
                        placeholder="Paste the key from the success page"
                        value={accessKey}
                        onChange={(e) => setAccessKey(e.target.value)}
                        size="lg"
                        bg="white"
                        borderColor="neutral.200"
                        _focus={{
                          borderColor: 'brand.500',
                          boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                        }}
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <Button
                      type="submit"
                      isLoading={loading && !oauthPending}
                      loadingText="Verifying…"
                      bg="neutral.900"
                      color="white"
                      _hover={{ bg: 'neutral.700' }}
                    >
                      Sign in
                    </Button>
                  </VStack>
                </Box>

                <Button
                  variant="ghost"
                  size="sm"
                  alignSelf="flex-start"
                  px={0}
                  onClick={onManualToggle}
                  rightIcon={
                    manualOpen ? <ChevronUpIcon /> : <ChevronDownIcon />
                  }
                  color="neutral.600"
                  _hover={{ bg: 'transparent', color: 'neutral.900' }}
                >
                  Connection details
                </Button>

                <Collapse in={manualOpen} animateOpacity>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel
                        color="neutral.800"
                        fontWeight="medium"
                        fontSize="sm"
                      >
                        Hostname
                      </FormLabel>
                      <Input
                        type="text"
                        value={cliHostname}
                        onChange={(e) => persistHostname(e.target.value)}
                        bg="white"
                        borderColor="neutral.200"
                        _focus={{
                          borderColor: 'brand.500',
                          boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                        }}
                        autoComplete="off"
                      />
                      <FormHelperText color="neutral.500">
                        Sent as the <CodeInline>hostname</CodeInline> query, the
                        same way the CLI does.
                      </FormHelperText>
                    </FormControl>
                    {loginPageUrl ? (
                      <Text
                        fontSize="xs"
                        color="neutral.500"
                        wordBreak="break-all"
                      >
                        <Link
                          href={loginPageUrl}
                          isExternal
                          color="brand.700"
                          fontWeight="medium"
                        >
                          {loginPageUrl}
                        </Link>
                      </Text>
                    ) : null}
                    <Text fontSize="sm" color="neutral.600" lineHeight="tall">
                      The API accepts{' '}
                      <CodeInline>
                        Authorization: Bearer &lt;accessKey&gt;
                      </CodeInline>
                      . Keys are issued on the server after OAuth. There is no
                      JSON login endpoint.
                    </Text>
                  </VStack>
                </Collapse>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

function CodeInline({ children }: { children: ReactNode }) {
  return (
    <Text
      as="span"
      fontFamily="mono"
      fontSize="sm"
      bg="neutral.100"
      px={1}
      rounded="sm"
    >
      {children}
    </Text>
  );
}
