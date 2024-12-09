- import { Box, Flex, Button, Text } from '@chakra-ui/react';
+ // Removido: importações do Chakra UI

- <Box>
+ <div>
  
-   <Flex justify="center" align="center">
+   <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      
-     <Button colorScheme="teal">Click Me</Button>
+     <button style={{
+       backgroundColor: 'teal',
+       color: 'white',
+       padding: '0.5rem 1rem',
+       border: 'none',
+       borderRadius: '4px',
+       cursor: 'pointer'
+     }}>Click Me</button>
      
-     <Text fontSize="xl">Hello World</Text>
+     <p style={{ fontSize: '1.25rem' }}>Hello World</p>
      
-   </Flex>
+   </div>
+ </div>