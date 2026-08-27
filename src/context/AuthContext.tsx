import { api, REFRESH_TOKEN_KEY, setOnAuthFailure, TOKEN_KEY } from "@/api";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Toast from "react-native-toast-message";

interface User {
  id: number | null;
  customer_id: string | null;
  fullName: string;
  email: string;
  status: string;
  type: string;
}

interface LoginCredentials {
  email: string;
}

interface SignupCredentials {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  accountType: "receiver" | "shipper";
}

interface AuthContextType {
  user: User;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  sendOtp: (email: string) => Promise<boolean>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  signup: (credentials: SignupCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const initialUser: User = {
  id: null,
  customer_id: "",
  fullName: "",
  email: "",
  status: "",
  type: "receiver",
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User>(initialUser);

  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async (): Promise<void> => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);

      if (!token) {
        setUser(initialUser);
        return;
      }

      const response = await api.get("/auth/me");

      const userData: User | undefined = response.data?.data;

      if (!userData?.id) {
        throw new Error("Invalid user session");
      }

      setUser(userData);
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);

      setUser(initialUser);
    }
  }, []);

  useEffect(() => {
    setOnAuthFailure(() => setUser(initialUser));
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);

      try {
        await loadSession();
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [loadSession]);

  const login = async ({ email }: LoginCredentials): Promise<boolean> => {
    try {
      const response = await api.post("/auth/login", { email });
      const result = response.data;

      if (!result?.success) {
        Toast.show({
          type: "error",
          text1: "Login failed",
          text2: result?.message || "Unable to login.",
        });
        return false;
      }

      Toast.show({
        type: "success",
        text1: "OTP sent",
        text2: result?.message || "Check your email.",
      });
      return true;
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Login failed",
        text2:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to login.",
      });
      return false;
    }
  };

  const sendOtp = async (email: string): Promise<boolean> => {
    try {
      const response = await api.post("/auth/sendOTP", { email });
      const result = response.data;

      if (!result?.success) {
        Toast.show({
          type: "error",
          text1: "Couldn't resend OTP",
          text2: result?.message || "Please try again.",
        });
        return false;
      }

      Toast.show({
        type: "success",
        text1: "OTP resent",
        text2: result?.message || "Check your email.",
      });

      return true;
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Couldn't resend OTP",
        text2:
          error?.response?.data?.message ||
          error?.message ||
          "Please try again.",
      });
      return false;
    }
  };

  const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
    try {
      const response = await api.post("/auth/verifyOTP", { email, otp });
      const result = response.data;

      if (!result?.success) {
        Toast.show({
          type: "error",
          text1: "Verification failed",
          text2: result?.message || "Invalid or expired OTP.",
        });
        return false;
      }

      const token = result?.data?.token;
      const refreshToken = result?.data?.refreshToken;
      if (!token) throw new Error("Authentication token was not returned.");

      await SecureStore.setItemAsync(TOKEN_KEY, token);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
      await loadSession();

      Toast.show({
        type: "success",
        text1: "Login successful",
        text2: result?.message || "Welcome back!",
      });
      return true;
    } catch (error: any) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setUser(initialUser);
      Toast.show({
        type: "error",
        text1: "Verification failed",
        text2:
          error?.response?.data?.message ||
          error?.message ||
          "Please try again.",
      });
      return false;
    }
  };

  const signup = async ({
    fullName,
    email,
    phone,
    password,
    accountType,
  }: SignupCredentials): Promise<boolean> => {
    try {
      const response = await api.post("/auth/signup", {
        fullName,
        email,
        phone,
        password,
        accountType,
      });
      const result = response.data;

      if (!result?.success) {
        Toast.show({
          type: "error",
          text1: "Signup failed",
          text2: result?.message || "Unable to create account.",
        });
        return false;
      }

      const token = result?.data?.token;
      const refreshToken = result?.data?.refreshToken;
      if (!token) throw new Error("Authentication token was not returned.");

      await SecureStore.setItemAsync(TOKEN_KEY, token);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
      await loadSession();

      Toast.show({
        type: "success",
        text1: "Account created",
        text2: result?.message || "Welcome to Consolidate!",
      });
      return true;
    } catch (error: any) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      setUser(initialUser);
      Toast.show({
        type: "error",
        text1: "Signup failed",
        text2:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to create account.",
      });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch (error: any) {
      console.warn(
        "[Logout] API failed:",
        error?.response?.data?.message || error?.message,
      );
    } finally {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setUser(initialUser);
      Toast.show({
        type: "success",
        text1: "Logged out",
        text2: "You have been logged out successfully.",
      });
      router.replace("/auth");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        sendOtp,
        verifyOtp,
        signup,
        logout,
        loadSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
