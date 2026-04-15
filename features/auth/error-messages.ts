interface AuthToastMessage {
  title: string;
  description: string;
}

const INVALID_CREDENTIALS: AuthToastMessage = {
  title: "Incorrect admin credentials",
  description:
    "The email or password is incorrect. Use a valid super admin or sub-admin account and try again.",
};

export function getAdminSignInErrorMessage(error: unknown): AuthToastMessage {
  const fallback: AuthToastMessage = {
    title: "Unable to sign in",
    description:
      "We could not complete the admin sign-in request right now. Please try again in a moment.",
  };

  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim().toLowerCase();

  if (!message) {
    return fallback;
  }

  if (
    message.includes("invalid email") ||
    message.includes("invalid password") ||
    message.includes("invalid credential") ||
    message.includes("invalid credentials") ||
    message.includes("wrong password") ||
    message.includes("unauthorized") ||
    message.includes("validation failed")
  ) {
    return INVALID_CREDENTIALS;
  }

  if (message.includes("missing next_public_api_url")) {
    return {
      title: "API configuration missing",
      description:
        "The admin portal is missing its backend API URL configuration. Set NEXT_PUBLIC_API_URL before signing in.",
    };
  }

  if (
    message.includes("only allows super admin and sub-admin accounts") ||
    message.includes("is not allowed on this admin portal")
  ) {
    return {
      title: "Access restricted",
      description:
        "This login is restricted to super admin and sub-admin accounts only.",
    };
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed")
  ) {
    return {
      title: "Backend unreachable",
      description:
        "The admin portal could not reach the authentication server. Check the API URL and backend availability, then try again.",
    };
  }

  if (message.includes("no access token was returned")) {
    return {
      title: "Invalid sign-in response",
      description:
        "The backend accepted the login but did not return a usable admin session.",
    };
  }

  return {
    title: "Unable to sign in",
    description: error.message,
  };
}
