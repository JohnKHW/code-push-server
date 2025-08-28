import {
  Box,
  VStack,
  HStack,
  Heading,
  Button,
  Text,
  Divider,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { ApiDebugger } from '../components/ApiDebugger';

export const DebugPage = () => {
  const navigate = useNavigate();

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <HStack spacing={4}>
          <Button
            leftIcon={<ArrowBackIcon />}
            variant="ghost"
            onClick={() => navigate('/apps')}
          >
            Back to Apps
          </Button>
          <Heading size="lg" color="primary.600">
            Debug Tools
          </Heading>
        </HStack>
      </HStack>

      <Box bg="white" rounded="md" shadow="sm" p={6}>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="md" mb={3}>
              API Connection Issues?
            </Heading>
            <Text color="gray.600">
              If you're experiencing problems with API calls, use the debugger below to diagnose the issue.
              This tool will help you test different connection methods and see detailed error messages.
            </Text>
          </Box>
          
          <Divider />
          
          <ApiDebugger />
        </VStack>
      </Box>
    </VStack>
  );
};