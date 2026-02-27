import { FC, useEffect } from 'react';
import { getUserInfoService } from '../../services/user';
import { getToken } from '../../utils/user-token';

type BridgePayload = {
  type: 'B_SSO_BRIDGE_RESULT';
  status: 'ok' | 'miss';
  token?: string;
  username?: string;
};

function getUsernameFromJwt(token: string): string {
  try {
    const payload = token.split('.')[1];
    if (!payload) return '';
    const json = JSON.parse(
      window.atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    );
    if (typeof json.username === 'string') return json.username;
    if (typeof json.name === 'string') return json.name;
    if (typeof json.sub === 'string') return json.sub;
    return '';
  } catch {
    return '';
  }
}

const SsoBridge: FC = () => {
  useEffect(() => {
    // origin 来自 C 端，用于 postMessage 的目标域限制
    const params = new URLSearchParams(window.location.search);
    const targetOrigin = params.get('origin') || '*';

    const postResult = (payload: BridgePayload) => {
      window.parent.postMessage(payload, targetOrigin);
      if (window.opener) {
        window.opener.postMessage(payload, targetOrigin);
      }
    };

    const token = getToken();
    if (!token) {
      // B 未登录：返回 miss，C 可继续展示未登录态
      postResult({ type: 'B_SSO_BRIDGE_RESULT', status: 'miss' });
      return;
    }

    const jwtUsername = getUsernameFromJwt(token);
    if (jwtUsername) {
      // 快路径：直接从 JWT payload 里取用户名
      postResult({
        type: 'B_SSO_BRIDGE_RESULT',
        status: 'ok',
        token,
        username: jwtUsername,
      });
      return;
    }

    const fetchUser = async () => {
      // 兜底：JWT 无 username 字段时，调用 /api/user/info 拿用户名
      try {
        const user = await getUserInfoService();
        if (!user.username) {
          postResult({ type: 'B_SSO_BRIDGE_RESULT', status: 'miss' });
          return;
        }

        postResult({
          type: 'B_SSO_BRIDGE_RESULT',
          status: 'ok',
          token,
          username: user.username,
        });
      } catch {
        postResult({ type: 'B_SSO_BRIDGE_RESULT', status: 'miss' });
      }
    };

    void fetchUser();
  }, []);

  return null;
};

export default SsoBridge;
