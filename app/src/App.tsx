import {
  ChakraProvider,
  extendTheme,
  Box,
  VStack,
  Spinner,
  Text,
} from "@chakra-ui/react";
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
  fonts: {
    heading: `'Inter', system-ui, sans-serif`,
    body: `'Inter', system-ui, sans-serif`,
  },
  colors: {
    brand: {
      50: "#FBF7EB",
      100: "#F5ECD4",
      200: "#EBD9A8",
      300: "#E0C67C",
      400: "#D4B84F",
      500: "#D4AF37",
      600: "#B8941F",
      700: "#8A6F18",
      800: "#5C4A10",
      900: "#2E2508",
    },
    neutral: {
      50: "#FAFAFA",
      100: "#F5F5F5",
      200: "#E5E5E5",
      300: "#D4D4D4",
      400: "#A3A3A3",
      500: "#737373",
      600: "#525252",
      700: "#404040",
      800: "#262626",
      900: "#171717",
    },
    // Legacy token names used across pages: 500 = accent, 600 = headings
    primary: {
      50: "#FAFAFA",
      100: "#F5F5F5",
      200: "#E5E5E5",
      300: "#D4D4D4",
      400: "#A3A3A3",
      500: "#D4AF37",
      600: "#171717",
      700: "#404040",
      800: "#262626",
      900: "#171717",
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: "brand",
      },
    },
  },
  styles: {
    global: {
      "html, body": {
        bg: "neutral.50",
        color: "neutral.900",
      },
      "@media (prefers-reduced-motion: reduce)": {
        "*, *::before, *::after": {
          animationDuration: "0.01ms !important",
          animationIterationCount: "1 !important",
          transitionDuration: "0.01ms !important",
        },
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
          bg="neutral.50"
        >
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" thickness="3px" speed="0.65s" />
            <Text color="neutral.600" fontSize="sm">
              Loading…
            </Text>
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
            element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" replace />}
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
