
import AuthProvider from "./context/AuthProvider.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
