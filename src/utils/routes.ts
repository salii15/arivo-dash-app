export const ROUTES = {
    HOME: '/',
    SIGNIN: '/signin',
    SIGNUP: '/signup',
    PROFILE: '/profile',
    PROJECTS: '/projects',
    PRODUCTS: '/products',
    ORDERS: '/orders',
    ANALYTICS: '/analytics',
  } as const;
  
  // Public rotalar - giriş yapmadan erişilebilecek sayfalar
  export const publicRoutes: string[] = [
    ROUTES.SIGNIN,
    ROUTES.SIGNUP,
  ];
  
  // Auth rotalar - sadece giriş yapmamış kullanıcıların erişebileceği sayfalar
  export const authRoutes: string[] = [
    ROUTES.SIGNIN,
    ROUTES.SIGNUP,
  ];
  
  // Korumalı rotalar - sadece giriş yapmış kullanıcıların erişebileceği sayfalar
  export const protectedRoutes: string[] = [
    ROUTES.PROFILE,
    ROUTES.PROJECTS,
    ROUTES.PRODUCTS,
    ROUTES.ORDERS,
    ROUTES.ANALYTICS,
  ];
  
  export const defaultRedirect: string = ROUTES.HOME;
  