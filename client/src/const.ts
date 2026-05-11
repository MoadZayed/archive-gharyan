export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // 1. جلب المتغيرات مع توفير قيم افتراضية (Fallback) لمنع انهيار التطبيق
  const oauthPortalUrl = 
    import.meta.env.VITE_OAUTH_PORTAL_URL || 
    import.meta.env.VITE_OAUTH_SERVER_URL || 
    "http://localhost:4001";
    
  const appId = import.meta.env.VITE_APP_ID || "gharyan-it-college";
  
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  // 2. حماية عملية بناء الرابط باستخدام try...catch
  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    // في حال حدوث أي خطأ غير متوقع، نطبع الخطأ للمطور ونعيد رابطاً آمناً
    console.error("[Auth Error] Invalid OAUTH URL:", error);
    return "/"; 
  }
};