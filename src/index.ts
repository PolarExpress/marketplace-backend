import { createContext } from "./context";
import { buildApp } from "./app";

const app = buildApp(createContext());

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });
}