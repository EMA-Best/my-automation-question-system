import { FC, useEffect } from 'react';
import { removeToken } from '../../utils/user-token';

const SsoLogout: FC = () => {
  useEffect(() => {
    // B 端本地 token 清理（无论 silent / 非 silent 模式都先执行）
    removeToken();

    const params = new URLSearchParams(window.location.search);
    const silent = params.get('silent') === '1';
    const targetOrigin = params.get('origin') || '*';

    if (silent) {
      // silent 模式：用于 C 端 iframe 静默退出，不做整页跳转
      const payload = { type: 'B_SSO_LOGOUT_RESULT', status: 'ok' as const };
      window.parent.postMessage(payload, targetOrigin);
      if (window.opener) {
        window.opener.postMessage(payload, targetOrigin);
      }
      return;
    }

    const callbackUrl =
      params.get('callbackUrl') || `${window.location.origin}/login`;
    window.location.replace(callbackUrl);
  }, []);

  return null;
};

export default SsoLogout;
