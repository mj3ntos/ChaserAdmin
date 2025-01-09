import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Możemy całkowicie usunąć middleware, ponieważ Firebase Auth 
  // i hook useAuth już zapewniają ochronę
  return NextResponse.next();
}

// // Alternatywnie, jeśli chcesz zachować middleware:
// export const config = {
//   matcher: [] // Pusty matcher wyłączy middleware dla wszystkich ścieżek
// };