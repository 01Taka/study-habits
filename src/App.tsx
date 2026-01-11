import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import MainLayout from "./components/MainLayout";

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <MainLayout />
    </MantineProvider>
  );
}
