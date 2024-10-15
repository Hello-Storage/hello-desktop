import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../state";

function UnprotectedRoute({ children }: { children: JSX.Element }) {
  const { authenticated } = useAppSelector((state) => state.user);
  return !authenticated ? children : <Navigate to="/dashboard" replace />;
}

export default UnprotectedRoute;