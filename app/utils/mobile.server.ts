import { redirect } from '@remix-run/node';
import isMobile from 'ismobilejs';
import { redirectBack } from 'remix-utils';

export async function requireMobile(request: Request, fallback?: string) {
  const userAgent = request.headers.get("user-agent");
  const { any: isMobilePhone } = isMobile(userAgent || undefined);

  if (!isMobilePhone) {
    const searchParams = new URL(request.url).searchParams;
    const redirectFallback = searchParams.get('redirectTo');
    if (redirectFallback) {
      throw redirect(redirectFallback);
    } else {
      throw redirectBack(request, { fallback: fallback || '/' });
    }
  }
}
