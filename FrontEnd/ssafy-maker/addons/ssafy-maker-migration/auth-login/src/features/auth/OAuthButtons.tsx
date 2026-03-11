import { OAUTH_PROVIDERS } from './authConfig';

function OAuthButtons() {
  return (
    <div className="oauth-group">
      <p>소셜 계정으로 계속하기</p>
      <div className="oauth-buttons">
        {OAUTH_PROVIDERS.map((provider) => (
          <a key={provider.name} className={provider.className} href={provider.href}>
            {provider.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export default OAuthButtons;
