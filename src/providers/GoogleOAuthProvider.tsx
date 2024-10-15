import { FC, ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

const GoogleOAuth: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
};

export default GoogleOAuth;
