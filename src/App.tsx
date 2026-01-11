import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import MainLayout from "./components/MainLayout";

export default function App() {
  return (
    <MantineProvider>
      <MainLayout />
    </MantineProvider>
  );
}
