import { ChakraProvider, extendTheme, Box, VStack, Spinner, Text } from "@chakra-ui/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { Layout } from "./components/Layout";
import { AppsPage } from "./pages/AppsPage";
import { DeploymentsPage } from "./pages/DeploymentsPage";
import { DebugPage } from "./pages/DebugPage";
import { AccountPage } from "./pages/AccountPage";
import { AccessKeysPage } from "./pages/AccessKeysPage";
import { MetricsPage } from "./pages/MetricsPage";
import { useAuth } from "./hooks/useAuth";

const theme = extendTheme({
  colors: {
    primary: {
      50: '#EAF7FE',
      100: '#D5EEFD',
      200: '#ABE0FB',
      300: '#81D2F9',
      400: '#57C4F7',
      500: '#87CEEB', // main primary color
      600: '#1C95CD',
      700: '#15729C',
      800: '#0D4E6A',
      900: '#062B39',
    },
    brand: {
      50: '#EAF7FE',
      100: '#D5EEFD',
      200: '#ABE0FB',
      300: '#81D2F9',
      400: '#57C4F7',
      500: '#87CEEB',
      600: '#1C95CD',
      700: '#15729C',
      800: '#0D4E6A',
      900: '#062B39',
    }
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
      },
    },
  },
});

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <ChakraProvider theme={theme}>
        <Box
          height="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="gray.50"
        >
          <VStack spacing={4}>
            <Spinner size="xl" color="primary.500" />
            <Text color="gray.600">Loading CodePush Admin...</Text>
          </VStack>
        </Box>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/auth"
            element={
              !isAuthenticated ? <AuthPage /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/apps" replace />} />
                    <Route path="/apps" element={<AppsPage />} />
                    <Route
                      path="/apps/:appName/deployments"
                      element={<DeploymentsPage />}
                    />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/access-keys" element={<AccessKeysPage />} />
                    <Route path="/metrics" element={<MetricsPage />} />
                    <Route path="/debug" element={<DebugPage />} />
                  </Routes>
                </Layout>
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;