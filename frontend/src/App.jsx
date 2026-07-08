import AppRoutes from "./routes/AppRoutes";
import { ThemeProvider } from "./context/ThemeContext";
import { GamificationProvider } from "./context/GamificationContext";
import { AuthProvider } from "./context/AuthContext";
import NotificationManager from "./components/layout/NotificationManager";

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <GamificationProvider>
                    <NotificationManager />
                    <AppRoutes />
                </GamificationProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
