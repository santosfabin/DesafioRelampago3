import { useEffect } from "react";
import { useNavigate } from "react-router";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

interface LogoutProps {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

const Logout = ({ setIsAuthenticated }: LogoutProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate API call for logout if your backend requires it
    const performLogout = async () => {
      try {
        // Example: await fetch('/api/logout', { method: 'DELETE', headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`} });
        // No specific backend logout endpoint mentioned, so we just clear client side
      } catch (error) {
        console.error("Logout failed on server:", error);
        // Decide if you still want to log out client-side
      } finally {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        window.dispatchEvent(new Event("tokenChanged"));
        navigate("/login");
      }
    };

    performLogout();
  }, [navigate, setIsAuthenticated]);

  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{ textAlign: "center", mt: 8 }}
    >
      <Box
        sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Logging out...
        </Typography>
      </Box>
    </Container>
  );
};

export default Logout;
